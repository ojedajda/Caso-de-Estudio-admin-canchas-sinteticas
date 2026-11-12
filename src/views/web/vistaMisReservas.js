/**
 * Vista web - HU03 Cancelación y Reagendamiento de Turnos
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'mis-reservas',
        hu: 'HU03',
        titulo: 'Cancelar / reagendar',
        grupo: 'Cliente',
        orden: 3,
        render(el, sistema, params) {
            const { UI, Fechas } = CG;
            const horas = CG.GestionReservaController.HORAS_MINIMAS_CAMBIO;
            el.innerHTML = `
                <div class="titulo-vista">
                    <div><h2>Mis reservas: cancelar o reagendar</h2>
                    <p class="muted">Puedes cancelar o cambiar tu turno hasta ${horas} h antes del partido. Al cancelar, lo pagado queda
                    como saldo a favor para tu próxima reserva (o, si lo prefieres, como reembolso). Con menos de ${horas} h ya no se permiten cambios.</p></div>
                </div>
                <div class="tarjeta">
                    <form id="buscar" class="fila-botones">
                        <label>Celular con el que reservaste <input name="telefono" required pattern="3[0-9]{9}" value="${UI.esc(params.telefono || '')}" placeholder="3001234567"></label>
                        <button class="btn btn-primario" type="submit">Buscar mis reservas</button>
                    </form>
                </div>
                <div id="lista"></div>`;
            const form = el.querySelector('#buscar');
            const lista = el.querySelector('#lista');

            const pintar = () => {
                const telefono = form.telefono.value.trim();
                const reservas = sistema.gestion.reservasVigentes(telefono);
                const saldo = sistema.gestion.saldoAFavor(telefono);
                lista.innerHTML = `<div class="tarjeta">
                    <div class="fila-botones" style="justify-content:space-between"><h3>Reservas vigentes</h3>
                    <span>Saldo a favor: <b>${UI.cop(saldo)}</b></span></div>
                    ${reservas.length ? `<div class="tabla-contenedor"><table><tr><th>Código</th><th>Turno</th><th class="num">Pagado</th><th>Política</th><th>Cancelar</th><th>Reagendar</th></tr>
                    ${reservas.map((r) => {
                        const p = sistema.gestion.politica(r);
                        return `<tr data-codigo="${r.codigo}">
                            <td><b>${r.codigo}</b></td>
                            <td>${UI.esc(UI.nombreCancha(sistema, r.canchaId))}<br><small>${Fechas.nombreDia(r.fecha)} ${r.fecha} · ${UI.hora(r.hora)}</small></td>
                            <td class="num">${UI.cop(r.pagado)}<br><small>de ${UI.cop(r.valorTotal)}</small></td>
                            <td><small>Faltan ${p.horasRestantes} h<br>${p.puedeCancelar ? 'Cambios permitidos' : `Sin cambios (menos de ${horas} h)`}</small></td>
                            <td>${p.puedeCancelar ? `<div class="fila-botones"><select name="destino">${UI.opciones([['SALDO_A_FAVOR', 'Saldo a favor'], ['REEMBOLSO', 'Reembolso']], 'SALDO_A_FAVOR')}</select>
                                <button class="btn btn-peligro btn-chico" data-accion="cancelar">Cancelar</button></div>` : `<small>No disponible (menos de ${horas} h)</small>`}</td>
                            <td>${p.puedeReagendar ? `<div class="fila-botones"><input type="date" name="nuevaFecha" min="${Fechas.hoy()}" value="${r.fecha}">
                                <select name="nuevaHora"></select><button class="btn btn-chico" data-accion="reagendar">Mover</button></div>` : `<small>No disponible (menos de ${horas} h)</small>`}</td></tr>`;
                    }).join('')}</table></div>` : UI.vacio('No tienes reservas vigentes con ese número.')}</div>`;
                lista.querySelectorAll('tr[data-codigo]').forEach((fila) => {
                    const fecha = fila.querySelector('[name="nuevaFecha"]');
                    if (!fecha) {
                        return;
                    }
                    const reserva = sistema.reservas.obtenerPorCodigo(fila.dataset.codigo);
                    const llenar = () => {
                        const libres = UI.intentar(() => sistema.disponibilidad.horasLibres(reserva.canchaId, fecha.value, new Date(), reserva.id)) || [];
                        fila.querySelector('[name="nuevaHora"]').innerHTML = UI.opcionesHoras(libres.filter((h) => !(fecha.value === reserva.fecha && h === reserva.hora)));
                    };
                    fecha.addEventListener('change', llenar);
                    llenar();
                });
            };

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                pintar();
            });
            lista.addEventListener('click', (e) => {
                const boton = e.target.closest('[data-accion]');
                if (!boton) {
                    return;
                }
                const fila = boton.closest('tr');
                const codigo = fila.dataset.codigo;
                if (boton.dataset.accion === 'cancelar') {
                    const resultado = UI.intentar(() => sistema.gestion.cancelar(codigo, fila.querySelector('[name="destino"]').value));
                    if (resultado) {
                        const partes = [];
                        if (resultado.alSaldo) partes.push(`${UI.cop(resultado.alSaldo)} a tu saldo a favor`);
                        if (resultado.reembolsado) partes.push(`${UI.cop(resultado.reembolsado)} de reembolso`);
                        UI.toast(`Reserva ${codigo} cancelada${partes.length ? `: ${partes.join(' y ')}` : ''}. La franja quedó libre.`);
                    }
                } else {
                    const hora = fila.querySelector('[name="nuevaHora"]').value;
                    UI.intentar(() => sistema.gestion.reagendar(codigo, { fecha: fila.querySelector('[name="nuevaFecha"]').value, hora: Number(hora) }),
                        `Reserva ${codigo} reagendada`);
                }
                pintar();
            });
            if (params.telefono) {
                pintar();
            }
        }
    });
})(window);
