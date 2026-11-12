/**
 * Vista web - HU02 Reserva de Cancha con Pago de Anticipo
 * Formulario de reserva con cotización en vivo y pago simulado del anticipo (50 %).
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'reservar',
        hu: 'HU02',
        titulo: 'Reservar cancha',
        grupo: 'Cliente',
        orden: 2,
        render(el, sistema, params, app) {
            const { UI, Fechas } = CG;
            const metodos = CG.ReservaController.METODOS_WEB.map((m) => [m, m === 'PSE' ? 'PSE (débito bancario)' : m.charAt(0) + m.slice(1).toLowerCase()]);
            const conPromos = Boolean(sistema.promociones);
            el.innerHTML = `
                <div class="titulo-vista">
                    <div><h2>Reservar cancha</h2>
                    <p class="muted">El turno se confirma al pagar el anticipo del ${CG.ReservaController.PORCENTAJE_ANTICIPO * 100} %. El saldo se paga al llegar a la cancha.</p></div>
                </div>
                <div class="rejilla rejilla-2">
                    <div class="tarjeta">
                        <form id="form-reserva">
                            <h3>1. Turno</h3>
                            <div class="campos">
                                <label>Cancha <select name="canchaId" required>${UI.opcionesCanchas(sistema, params.canchaId)}</select></label>
                                <label>Fecha <input type="date" name="fecha" min="${Fechas.hoy()}" value="${params.fecha || Fechas.hoy()}" required></label>
                                <label>Hora <select name="hora" required></select></label>
                            </div>
                            <h3>2. Tus datos</h3>
                            <div class="campos">
                                <label>Nombre completo <input name="nombre" required minlength="3" placeholder="Ej: Jesús Ojeda"></label>
                                <label>Celular (WhatsApp) <input name="telefono" required pattern="3[0-9]{9}" placeholder="3001234567"></label>
                            </div>
                            <h3>3. Pago del anticipo</h3>
                            <div class="campos">
                                <label>Medio de pago <select name="metodoPago">${UI.opciones(metodos, 'NEQUI')}</select></label>
                                ${conPromos ? '<label>Cupón de descuento <input name="codigoPromocion" placeholder="Opcional" style="text-transform:uppercase"></label>' : ''}
                            </div>
                            <div id="cotizacion"></div>
                            <button class="btn btn-primario" type="submit">Pagar anticipo y reservar</button>
                        </form>
                    </div>
                    <div id="resultado"></div>
                </div>`;
            const form = el.querySelector('#form-reserva');

            const actualizarHoras = (seleccion) => {
                const horas = UI.intentar(() => sistema.disponibilidad.horasLibres(Number(form.canchaId.value), form.fecha.value)) || [];
                form.hora.innerHTML = UI.opcionesHoras(horas, seleccion);
            };
            const cotizar = () => {
                const caja = el.querySelector('#cotizacion');
                if (!form.hora.value) {
                    caja.innerHTML = '<div class="aviso">No hay franjas libres para esa cancha y fecha.</div>';
                    return;
                }
                try {
                    const c = sistema.reservas.cotizar({ ...UI.datos(form), canchaId: Number(form.canchaId.value) });
                    caja.innerHTML = `<div class="resumen-pago">
                        <div><span>Tarifa ${UI.hora(Number(form.hora.value))} (${Fechas.nombreDia(form.fecha.value)})</span><span>${UI.cop(c.valorTarifa)}</span></div>
                        ${c.descuento ? `<div><span>Descuento ${UI.esc(c.codigoPromocion)}</span><span>- ${UI.cop(c.descuento)}</span></div>` : ''}
                        <div><span>Valor del turno</span><span>${UI.cop(c.valorTotal)}</span></div>
                        <div><span>Anticipo (${CG.ReservaController.PORCENTAJE_ANTICIPO * 100} %)</span><span>${UI.cop(c.anticipo)}</span></div>
                        ${c.saldoAFavorAplicado ? `<div><span>Saldo a favor aplicado</span><span>- ${UI.cop(c.saldoAFavorAplicado)}</span></div>` : ''}
                        <div class="total"><span>A pagar ahora</span><span>${UI.cop(c.aPagarAhora)}</span></div>
                        <div><small>Saldo a pagar en la cancha</small><small>${UI.cop(c.saldoEnCancha)}</small></div></div>`;
                } catch (error) {
                    caja.innerHTML = `<div class="aviso">${UI.esc(error.message)}</div>`;
                }
            };

            form.addEventListener('change', (e) => {
                if (e.target.name === 'canchaId' || e.target.name === 'fecha') {
                    actualizarHoras();
                }
                cotizar();
            });
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const datos = { ...UI.datos(form), canchaId: Number(form.canchaId.value), canal: 'WEB' };
                const reserva = UI.intentar(() => sistema.reservas.crearReserva(datos), 'Pago aprobado: reserva confirmada');
                if (!reserva) {
                    return;
                }
                el.querySelector('#resultado').innerHTML = `<div class="confirmacion">
                    <p>Reserva confirmada · presenta este código en recepción</p>
                    <div class="codigo">${reserva.codigo}</div>
                    <p><b>${UI.esc(UI.nombreCancha(sistema, reserva.canchaId))}</b> · ${Fechas.nombreDia(reserva.fecha)} ${reserva.fecha} · ${UI.hora(reserva.hora)}</p>
                    <div class="resumen-pago">
                        <div><span>Valor del turno</span><span>${UI.cop(reserva.valorTotal)}</span></div>
                        <div><span>Pagado (${UI.esc(datos.metodoPago)})</span><span>${UI.cop(reserva.pagado)}</span></div>
                        <div class="total"><span>Saldo en la cancha</span><span>${UI.cop(reserva.saldoPendiente)}</span></div>
                    </div>
                    ${sistema.notificaciones ? '<p class="muted">Te enviamos la confirmación por WhatsApp.</p>' : ''}
                    <button class="btn" id="otra">Hacer otra reserva</button></div>`;
                el.querySelector('#otra').addEventListener('click', () => app.ir('disponibilidad'));
                actualizarHoras();
                cotizar();
            });
            actualizarHoras(params.hora);
            cotizar();
        }
    });
})(window);
