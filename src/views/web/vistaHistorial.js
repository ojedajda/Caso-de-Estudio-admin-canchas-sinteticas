/**
 * Vista web - HU10 Historial de Reservas y Repetición de Turno Frecuente
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'historial',
        hu: 'HU10',
        titulo: 'Mi historial',
        grupo: 'Cliente',
        orden: 4,
        render(el, sistema) {
            const { UI, Fechas } = CG;
            const metodos = CG.ReservaController.METODOS_WEB.map((m) => [m, m]);
            el.innerHTML = `
                <div class="titulo-vista">
                    <div><h2>Historial de reservas</h2>
                    <p class="muted">Consulta tus turnos y repite tu horario habitual con un clic (se busca cupo en las próximas 4 semanas).</p></div>
                </div>
                <div class="tarjeta">
                    <form id="buscar" class="fila-botones">
                        <label>Celular <input name="telefono" required pattern="3[0-9]{9}" placeholder="3001234567"></label>
                        <label>Medio de pago para repetir <select name="metodo">${UI.opciones(metodos, 'NEQUI')}</select></label>
                        <button class="btn btn-primario" type="submit">Ver historial</button>
                    </form>
                </div>
                <div id="contenido"></div>`;
            const form = el.querySelector('#buscar');
            const contenido = el.querySelector('#contenido');

            const pintar = () => {
                const { reservas, resumen } = sistema.historial.historial(form.telefono.value.trim());
                if (!reservas.length) {
                    contenido.innerHTML = `<div class="tarjeta">${UI.vacio('No hay reservas registradas con ese número.')}</div>`;
                    return;
                }
                const frecuente = resumen.turnoFrecuente;
                const baseFrecuente = frecuente && reservas.find((r) => r.canchaId === frecuente.canchaId && r.hora === frecuente.hora
                    && Fechas.nombreDia(r.fecha) === frecuente.dia);
                contenido.innerHTML = `
                    <div class="rejilla rejilla-4" style="margin-bottom:1rem">
                        <div class="kpi"><small>Reservas</small><b>${resumen.total}</b></div>
                        <div class="kpi"><small>Partidos jugados</small><b>${resumen.jugadas}</b></div>
                        <div class="kpi"><small>Canceladas</small><b>${resumen.canceladas}</b></div>
                        <div class="kpi"><small>Invertido en partidos</small><b>${UI.cop(resumen.invertido)}</b></div>
                    </div>
                    ${frecuente ? `<div class="tarjeta fila-botones" style="justify-content:space-between">
                        <div><h3>Tu turno frecuente</h3><p>${UI.esc(frecuente.cancha)} · los ${frecuente.dia} a las ${UI.hora(frecuente.hora)} (${frecuente.veces} veces)</p></div>
                        <button class="btn btn-primario" data-repetir="${baseFrecuente.codigo}">Repetir mi turno frecuente</button></div>` : ''}
                    <div class="tarjeta"><div class="tabla-contenedor"><table>
                        <tr><th>Código</th><th>Cancha</th><th>Turno</th><th>Canal</th><th class="num">Valor</th><th>Estado</th><th></th></tr>
                        ${reservas.map((r) => `<tr><td><b>${r.codigo}</b></td><td>${UI.esc(UI.nombreCancha(sistema, r.canchaId))}</td>
                            <td>${Fechas.nombreDia(r.fecha)} ${r.fecha} · ${UI.hora(r.hora)}</td><td><small>${r.canal}</small></td>
                            <td class="num">${UI.cop(r.valorTotal)}</td><td>${UI.estado(r.estado)}</td>
                            <td><button class="btn btn-chico" data-repetir="${r.codigo}">Repetir</button></td></tr>`).join('')}
                    </table></div></div>`;
            };

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                pintar();
            });
            contenido.addEventListener('click', (e) => {
                const boton = e.target.closest('[data-repetir]');
                if (!boton) {
                    return;
                }
                const nueva = UI.intentar(() => sistema.historial.repetirTurno(boton.dataset.repetir, form.metodo.value));
                if (nueva) {
                    UI.toast(`Turno repetido: ${nueva.codigo} el ${nueva.fecha} a las ${UI.hora(nueva.hora)}`);
                    pintar();
                }
            });
        }
    });
})(window);
