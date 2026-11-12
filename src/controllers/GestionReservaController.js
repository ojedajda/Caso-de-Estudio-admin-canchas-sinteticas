/**
 * Controlador (Facade) de Cancelación y Reagendamiento de Turnos (HU03)
 * Política del establecimiento:
 *  - Cancelar con 24 h o más de anticipación: se devuelve lo pagado como saldo a favor o reembolso.
 *  - Cancelar con menos de 24 h: el anticipo no se devuelve (compensa la franja perdida).
 *  - Reagendar: solo con 24 h o más de anticipación y hacia una franja libre.
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Fechas = importar('../utils/Fechas', 'Fechas');
    const Reserva = importar('../models/Reserva', 'Reserva');
    const Pago = importar('../models/Pago', 'Pago');

    const HORAS_MINIMAS_DEVOLUCION = 24;
    const HORAS_MINIMAS_REAGENDAR = 24;
    const DESTINOS = ['SALDO_A_FAVOR', 'REEMBOLSO'];

    class GestionReservaController {
        /**
         * @param {Object} deps Dependencias: reservaDAO, clienteDAO, reservas, disponibilidad,
         *   canchaController y notificador (opcional, HU09)
         */
        constructor(deps) {
            this.deps = deps;
        }

        /**
         * Contrato: Reservas futuras confirmadas de un cliente
         * @param {string} telefono
         * @param {Date} [ahora=new Date()]
         * @returns {Array<Reserva>}
         */
        reservasVigentes(telefono, ahora = new Date()) {
            return this.deps.reservaDAO.buscarPorTelefono(telefono)
                .filter((r) => r.estado === Reserva.ESTADOS.CONFIRMADA && Fechas.horasHasta(r.fecha, r.hora, ahora) > 0)
                .sort((a, b) => (a.fecha + String(a.hora).padStart(2, '0')).localeCompare(b.fecha + String(b.hora).padStart(2, '0')));
        }

        /**
         * Contrato: Saldo a favor disponible de un cliente
         * @param {string} telefono
         * @returns {number}
         */
        saldoAFavor(telefono) {
            const cliente = this.deps.clienteDAO.buscarPorTelefono(telefono);
            return cliente ? cliente.saldoAFavor : 0;
        }

        /**
         * Contrato: Qué permite la política para una reserva en este momento
         * @param {Reserva} reserva
         * @param {Date} [ahora=new Date()]
         * @returns {{horasRestantes: number, conDevolucion: boolean, puedeReagendar: boolean}}
         */
        politica(reserva, ahora = new Date()) {
            const horasRestantes = Fechas.horasHasta(reserva.fecha, reserva.hora, ahora);
            return {
                horasRestantes: Math.round(horasRestantes * 10) / 10,
                conDevolucion: horasRestantes >= HORAS_MINIMAS_DEVOLUCION,
                puedeReagendar: horasRestantes >= HORAS_MINIMAS_REAGENDAR
            };
        }

        /**
         * Contrato: Cancela una reserva aplicando la política de devolución
         * @param {string} codigo
         * @param {string} [destino='SALDO_A_FAVOR'] SALDO_A_FAVOR o REEMBOLSO
         * @param {Date} [ahora=new Date()]
         * @returns {{reserva: Reserva, devuelto: number, destino: string|null}}
         * @throws {Error} Si la reserva no existe, no está confirmada o el turno ya inició
         */
        cancelar(codigo, destino = 'SALDO_A_FAVOR', ahora = new Date()) {
            if (!DESTINOS.includes(destino)) {
                throw new Error('El destino de la devolución debe ser SALDO_A_FAVOR o REEMBOLSO');
            }
            const reserva = this.validarModificable(codigo, ahora);
            const { conDevolucion } = this.politica(reserva, ahora);
            const devuelto = conDevolucion ? reserva.pagado : 0;
            if (devuelto > 0) {
                if (destino === 'SALDO_A_FAVOR') {
                    this.abonarSaldo(reserva.clienteTelefono, devuelto);
                } else {
                    this.deps.reservas.registrarPago(reserva, Pago.TIPOS.REEMBOLSO, -devuelto, 'TRANSFERENCIA', ahora);
                }
            }
            const marca = `${Fechas.hoy(ahora)} ${Fechas.horaActual(ahora)}`;
            const detalle = devuelto > 0
                ? `devolución de $${devuelto} como ${destino === 'REEMBOLSO' ? 'reembolso' : 'saldo a favor'}`
                : 'sin devolución (menos de 24 h de anticipación)';
            this.deps.reservaDAO.actualizar(reserva.id, {
                estado: Reserva.ESTADOS.CANCELADA,
                historial: [...reserva.historial, `${marca} - Cancelada por el cliente, ${detalle}`]
            });
            this.notificar('CANCELACION', reserva, ahora, detalle);
            return { reserva, devuelto, destino: devuelto > 0 ? destino : null };
        }

        /**
         * Contrato: Mueve una reserva a otra franja libre (misma u otra cancha)
         * @param {string} codigo
         * @param {Object} nueva
         * @param {string} nueva.fecha
         * @param {number} nueva.hora
         * @param {number} [nueva.canchaId] Por defecto la misma cancha
         * @param {Date} [ahora=new Date()]
         * @returns {Reserva} Reserva reagendada
         * @throws {Error} Si no cumple la política o la nueva franja no está libre
         */
        reagendar(codigo, nueva, ahora = new Date()) {
            const reserva = this.validarModificable(codigo, ahora);
            if (!this.politica(reserva, ahora).puedeReagendar) {
                throw new Error(`Solo se puede reagendar con ${HORAS_MINIMAS_REAGENDAR} h o más de anticipación`);
            }
            const canchaId = Number(nueva.canchaId || reserva.canchaId);
            const hora = Number(nueva.hora);
            const cancha = this.deps.disponibilidad.validarFranja(canchaId, nueva.fecha, hora, ahora, reserva.id);
            const valorTarifa = this.deps.canchaController.tarifaFranja(cancha, nueva.fecha, hora);
            const descuento = Math.min(reserva.descuento, valorTarifa);
            const valorTotal = valorTarifa - descuento;
            const excedente = Math.max(0, reserva.pagado - valorTotal);
            if (excedente > 0) {
                this.abonarSaldo(reserva.clienteTelefono, excedente);
            }
            const marca = `${Fechas.hoy(ahora)} ${Fechas.horaActual(ahora)}`;
            const anterior = `${reserva.fecha} ${Fechas.formatoHora(reserva.hora)}`;
            this.deps.reservaDAO.actualizar(reserva.id, {
                canchaId,
                fecha: nueva.fecha,
                hora,
                valorTarifa,
                descuento,
                valorTotal,
                pagado: reserva.pagado - excedente,
                recordatorioEnviado: false,
                historial: [...reserva.historial,
                    `${marca} - Reagendada de ${anterior} a ${nueva.fecha} ${Fechas.formatoHora(hora)} (${cancha.nombre})`]
            });
            this.notificar('REAGENDAMIENTO', reserva, ahora, `antes: ${anterior}`);
            return reserva;
        }

        /**
         * Contrato: Valida que la reserva exista, esté confirmada y no haya iniciado
         * @param {string} codigo
         * @param {Date} ahora
         * @returns {Reserva}
         * @throws {Error}
         */
        validarModificable(codigo, ahora) {
            const reserva = this.deps.reservas.obtenerPorCodigo(codigo);
            if (reserva.estado !== Reserva.ESTADOS.CONFIRMADA) {
                throw new Error(`La reserva ${reserva.codigo} está ${reserva.estado.toLowerCase()} y no se puede modificar`);
            }
            if (Fechas.horasHasta(reserva.fecha, reserva.hora, ahora) <= 0) {
                throw new Error(`El turno de la reserva ${reserva.codigo} ya inició o terminó`);
            }
            return reserva;
        }

        /**
         * Contrato: Suma saldo a favor a un cliente
         * @param {string} telefono
         * @param {number} monto
         */
        abonarSaldo(telefono, monto) {
            const cliente = this.deps.clienteDAO.buscarPorTelefono(telefono);
            if (cliente) {
                this.deps.clienteDAO.actualizar(cliente.id, { saldoAFavor: cliente.saldoAFavor + monto });
            }
        }

        /**
         * Contrato: Notifica al cliente si la HU09 está instalada
         * @param {string} tipo
         * @param {Reserva} reserva
         * @param {Date} ahora
         * @param {string} detalle
         */
        notificar(tipo, reserva, ahora, detalle) {
            if (this.deps.notificador) {
                this.deps.notificador.notificar(tipo, reserva, detalle, ahora);
            }
        }
    }

    GestionReservaController.HORAS_MINIMAS_DEVOLUCION = HORAS_MINIMAS_DEVOLUCION;
    GestionReservaController.HORAS_MINIMAS_REAGENDAR = HORAS_MINIMAS_REAGENDAR;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GestionReservaController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).GestionReservaController = GestionReservaController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
