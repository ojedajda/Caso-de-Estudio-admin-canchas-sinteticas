/**
 * Vista web - HU06 Reporte y Monitoreo de Recaudos Diarios
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'reportes',
        hu: 'HU06',
        titulo: 'Recaudos del día',
        grupo: 'Administración',
        orden: 11,
        render(el, sistema) {
            const { UI, Fechas } = CG;
            el.innerHTML = `
                <div class="titulo-vista">
                    <div><h2>Reporte de recaudos diarios</h2>
                    <p class="muted">Cierre de caja: anticipos, saldos cobrados, reembolsos e indicadores del día.</p></div>
                    <form id="filtro" class="fila-botones">
                        <label>Fecha <input type="date" name="fecha" value="${Fechas.hoy()}"></label>
                        <button class="btn" type="button" id="csv">Exportar CSV (Excel)</button>
                    </form>
                </div>
                <div id="contenido"></div>`;
            const form = el.querySelector('#filtro');
            const contenido = el.querySelector('#contenido');

            const pintar = () => {
                const r = UI.intentar(() => sistema.reportes.recaudoDiario(form.fecha.value));
                if (!r) {
                    return;
                }
                const i = r.indicadores;
                contenido.innerHTML = `
                    <div class="rejilla rejilla-4" style="margin-bottom:1rem">
                        <div class="kpi"><small>Total neto en caja</small><b>${UI.cop(r.totalNeto)}</b></div>
                        <div class="kpi"><small>Anticipos</small><b>${UI.cop(r.anticipos)}</b></div>
                        <div class="kpi"><small>Saldos cobrados</small><b>${UI.cop(r.saldos)}</b></div>
                        <div class="kpi"><small>Pagos completos (taquilla)</small><b>${UI.cop(r.pagosTotales)}</b></div>
                        <div class="kpi"><small>Reembolsos</small><b>${UI.cop(r.reembolsos)}</b></div>
                        <div class="kpi"><small>Saldo por cobrar hoy</small><b>${UI.cop(i.saldoPorCobrar)}</b></div>
                        <div class="kpi"><small>Turnos (jugados / confirmados)</small><b>${i.turnosDelDia} <small>(${i.ingresadas} / ${i.confirmadas})</small></b></div>
                        <div class="kpi"><small>Ocupación · cancelaciones</small><b>${i.ocupacion} % · ${i.canceladas}</b></div>
                    </div>
                    <div class="rejilla rejilla-2">
                        <div class="tarjeta"><h3>Por medio de pago</h3>${Object.keys(r.porMetodo).length ? `<table>
                            ${Object.entries(r.porMetodo).map(([m, v]) => `<tr><td>${m}</td><td class="num">${UI.cop(v)}</td></tr>`).join('')}</table>` : UI.vacio('Sin movimientos.')}
                            ${r.saldoAFavorUsado ? `<p class="muted">Saldo a favor usado por clientes (no es caja): ${UI.cop(r.saldoAFavorUsado)}</p>` : ''}</div>
                        <div class="tarjeta"><h3>Por cancha</h3><table><tr><th>Cancha</th><th class="num">Movimientos</th><th class="num">Total</th></tr>
                            ${r.porCancha.map((c) => `<tr><td>${UI.esc(c.cancha)}</td><td class="num">${c.movimientos}</td><td class="num">${UI.cop(c.total)}</td></tr>`).join('')}</table></div>
                    </div>
                    <div class="tarjeta"><h3>Movimientos del día</h3>${r.movimientos.length ? `<div class="tabla-contenedor"><table>
                        <tr><th>Hora</th><th>Reserva</th><th>Tipo</th><th>Medio</th><th>Referencia</th><th class="num">Monto</th></tr>
                        ${r.movimientos.map((p) => `<tr><td>${p.hora}</td><td>${p.codigoReserva}</td><td>${p.tipo}</td><td>${p.metodo}</td><td><small>${p.referencia}</small></td><td class="num">${UI.cop(p.monto)}</td></tr>`).join('')}
                        </table></div>` : UI.vacio('No hubo movimientos en esta fecha.')}</div>`;
            };

            form.addEventListener('change', pintar);
            el.querySelector('#csv').addEventListener('click', () => {
                const csv = UI.intentar(() => sistema.reportes.exportarCSV(form.fecha.value));
                if (csv) {
                    UI.descargar(`recaudo-${form.fecha.value}.csv`, csv);
                }
            });
            pintar();
        }
    });
})(window);
