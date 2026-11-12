/**
 * Vista web - HU07 Registro de Ingreso y Cobro de Saldo Restante
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'ingreso',
        hu: 'HU07',
        titulo: 'Ingreso y cobro',
        grupo: 'Recepción',
        orden: 7,
        render(el, sistema) {
            const { UI, Fechas } = CG;
            const metodos = CG.ReservaController.METODOS_TAQUILLA.map((m) => [m, m]);
            el.innerHTML = `
                <div class="titulo-vista">
                    <div><h2>Ingreso y cobro de saldo</h2>
                    <p class="muted">Busca la reserva, cobra el saldo pendiente y autoriza la entrada a la cancha.</p></div>
                </div>
                <div class="tarjeta">
                    <form id="buscar" class="fila-botones">
                        <label>Código o celular <input name="termino" placeholder="CG-0001 o 3001234567"></label>
                        <button class="btn btn-primario" type="submit">Buscar</button>
                        <button class="btn" type="button" id="hoy">Ver agenda de hoy</button>
                    </form>
                </div>
                <div class="tarjeta"><h3 id="titulo-lista"></h3><div id="lista"></div></div>`;
            const form = el.querySelector('#buscar');
            const lista = el.querySelector('#lista');
            let modo = 'hoy';

            const pintar = () => {
                const reservas = modo === 'hoy' ? sistema.acceso.agendaDelDia(Fechas.hoy()) : sistema.acceso.buscar(form.termino.value);
                el.querySelector('#titulo-lista').textContent = modo === 'hoy' ? `Agenda de hoy (${Fechas.hoy()})` : 'Resultados de la búsqueda';
                lista.innerHTML = reservas.length ? `<div class="tabla-contenedor"><table>
                    <tr><th>Hora</th><th>Código</th><th>Cliente</th><th>Cancha</th><th class="num">Saldo</th><th>Estado</th><th>Acción</th></tr>
                    ${reservas.map((r) => `<tr data-codigo="${r.codigo}"><td><b>${UI.hora(r.hora)}</b><br><small>${r.fecha}</small></td><td>${r.codigo}</td>
                        <td>${UI.esc(r.clienteNombre)}<br><small>${r.clienteTelefono}</small></td><td>${UI.esc(UI.nombreCancha(sistema, r.canchaId))}</td>
                        <td class="num">${UI.cop(r.saldoPendiente)}</td><td>${UI.estado(r.estado)}${r.horaIngreso ? `<br><small>Ingresó ${r.horaIngreso}</small>` : ''}</td>
                        <td>${r.estado === 'CONFIRMADA' ? `<div class="fila-botones">${r.saldoPendiente ? `<select name="metodo">${UI.opciones(metodos, 'EFECTIVO')}</select>` : ''}
                            <button class="btn btn-primario btn-chico" data-ingreso>${r.saldoPendiente ? 'Cobrar y dar ingreso' : 'Dar ingreso'}</button></div>` : '—'}</td></tr>`).join('')}
                    </table></div>` : UI.vacio(modo === 'hoy' ? 'No hay turnos para hoy.' : 'No se encontraron reservas activas.');
            };

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                modo = 'buscar';
                pintar();
            });
            el.querySelector('#hoy').addEventListener('click', () => {
                modo = 'hoy';
                pintar();
            });
            lista.addEventListener('click', (e) => {
                if (!e.target.closest('[data-ingreso]')) {
                    return;
                }
                const fila = e.target.closest('tr');
                const metodo = fila.querySelector('[name="metodo"]');
                const resultado = UI.intentar(() => sistema.acceso.registrarIngreso(fila.dataset.codigo, metodo ? metodo.value : 'EFECTIVO'));
                if (resultado) {
                    UI.toast(`Ingreso autorizado (${resultado.reserva.codigo}). Cobrado: ${UI.cop(resultado.cobrado)}`);
                    pintar();
                }
            });
            pintar();
        }
    });
})(window);
