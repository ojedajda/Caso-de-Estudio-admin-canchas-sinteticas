/**
 * Vista web - HU08 Registro Manual de Reservas Presenciales o Telefónicas
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'taquilla',
        hu: 'HU08',
        titulo: 'Reserva en taquilla',
        grupo: 'Recepción',
        orden: 6,
        render(el, sistema) {
            const { UI, Fechas } = CG;
            const metodos = CG.ReservaController.METODOS_TAQUILLA.map((m) => [m, m]);
            el.innerHTML = `
                <div class="titulo-vista">
                    <div><h2>Registro manual de reservas</h2>
                    <p class="muted">Para clientes que reservan en ventanilla o por llamada. El turno se bloquea de inmediato en la agenda web.</p></div>
                </div>
                <div class="rejilla rejilla-2">
                    <div class="tarjeta">
                        <form id="form-taquilla">
                            <div class="campos">
                                <label>Canal <select name="canal">${UI.opciones([['PRESENCIAL', 'Presencial (ventanilla)'], ['TELEFONICA', 'Telefónica']], 'PRESENCIAL')}</select></label>
                                <label>Cancha <select name="canchaId">${UI.opcionesCanchas(sistema)}</select></label>
                                <label>Fecha <input type="date" name="fecha" min="${Fechas.hoy()}" value="${Fechas.hoy()}" required></label>
                                <label>Hora <select name="hora" required></select></label>
                                <label>Nombre del cliente <input name="nombre" required minlength="3"></label>
                                <label>Celular <input name="telefono" required pattern="3[0-9]{9}" placeholder="3001234567"></label>
                                <label>Medio de pago <select name="metodoPago">${UI.opciones(metodos, 'EFECTIVO')}</select></label>
                            </div>
                            <label class="check"><input type="checkbox" name="pagarTotal"> Cobrar el valor total (no solo el anticipo)</label>
                            <div id="valor"></div>
                            <button class="btn btn-primario" type="submit">Registrar y generar recibo</button>
                        </form>
                    </div>
                    <div id="recibo"></div>
                </div>`;
            const form = el.querySelector('#form-taquilla');

            const actualizar = (recalcularHoras) => {
                if (recalcularHoras) {
                    const horas = UI.intentar(() => sistema.disponibilidad.horasLibres(Number(form.canchaId.value), form.fecha.value)) || [];
                    form.hora.innerHTML = UI.opcionesHoras(horas);
                }
                const caja = el.querySelector('#valor');
                if (!form.hora.value) {
                    caja.innerHTML = '<div class="aviso">No hay franjas libres para esa cancha y fecha.</div>';
                    return;
                }
                try {
                    const c = sistema.reservas.cotizar({ canchaId: Number(form.canchaId.value), fecha: form.fecha.value, hora: Number(form.hora.value), telefono: form.telefono.value });
                    caja.innerHTML = `<div class="resumen-pago"><div><span>Valor del turno</span><span>${UI.cop(c.valorTotal)}</span></div>
                        <div class="total"><span>A cobrar ahora</span><span>${UI.cop(form.pagarTotal.checked ? c.valorTotal : c.anticipo)}</span></div></div>`;
                } catch (error) {
                    caja.innerHTML = `<div class="aviso">${UI.esc(error.message)}</div>`;
                }
            };
            const pintarRecibo = (r) => {
                el.querySelector('#recibo').innerHTML = `<div class="tarjeta"><div class="recibo">
                    <div><b>CanchaGO</b><b>${r.numero}</b></div><small>Emitido: ${r.emitido}</small><hr>
                    <div><span>Cliente</span><span>${UI.esc(r.cliente)}</span></div>
                    <div><span>Celular</span><span>${UI.esc(r.telefono)}</span></div>
                    <div><span>Canal</span><span>${r.canal}</span></div>
                    <div><span>Cancha</span><span>${UI.esc(r.cancha)}</span></div>
                    <div><span>Turno</span><span>${r.fecha} ${r.hora}</span></div><hr>
                    <div><span>Valor del turno</span><span>${UI.cop(r.valorTotal)}</span></div>
                    ${r.pagos.map((p) => `<div><span>${p.tipo} · ${p.metodo}</span><span>${UI.cop(p.monto)}</span></div>`).join('')}
                    <div><b>Saldo pendiente</b><b>${UI.cop(r.saldoPendiente)}</b></div><hr>
                    <div><span>Código de reserva</span><b>${r.codigo}</b></div></div>
                    <p class="no-imprimir" style="margin-top:.8rem"><button class="btn" onclick="window.print()">Imprimir recibo</button></p></div>`;
            };

            form.addEventListener('change', (e) => actualizar(e.target.name === 'canchaId' || e.target.name === 'fecha'));
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const datos = { ...UI.datos(form), canchaId: Number(form.canchaId.value), pagarTotal: form.pagarTotal.checked };
                const resultado = UI.intentar(() => sistema.taquilla.registrar(datos), 'Reserva registrada');
                if (resultado) {
                    pintarRecibo(resultado.recibo);
                    form.nombre.value = '';
                    form.telefono.value = '';
                    actualizar(true);
                }
            });
            actualizar(true);
        }
    });
})(window);
