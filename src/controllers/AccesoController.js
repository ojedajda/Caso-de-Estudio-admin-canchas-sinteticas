/**
 * Controlador (Facade) de Registro de Ingreso y Cobro de Saldo Restante (HU07)
 * La recepción busca la reserva, cobra el saldo pendiente y autoriza la entrada a la cancha.
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Fechas = importar('../utils/Fechas', 'Fechas');
    const Reserva = importar('../models/Reserva', 'Reserva');
    const Pago = importar('../models/Pago', 'Pago');
    const ReservaController = importar('./ReservaController', 'ReservaController');

    class AccesoController {
        /**
         * @param {Object} deps Dependencias: reservaDAO y reservas (ReservaController)
         */
        constructor(deps) {
            this.deps = deps;
        }

        /**
         * Contrato: Reservas de una fecha ordenadas por hora (agenda de recepción)
         * @param {string} fecha
         * @returns {Array<Reserva>}
         */
        agendaDelDia(fecha) {
            return this.deps.reservaDAO.buscarPorFecha(fecha)
                .filter((r) => r.estaActiva())
                .sort((a, b) => a.hora - b.hora || a.canchaId - b.canchaId);
        }

        /**
         * Contrato: Búsqueda rápida por código de reserva o teléfono del cliente
         * @param {string} termino Código (CG-0001) o teléfono
         * @returns {Array<Reserva>} Reservas activas que coinciden
         */
        buscar(termino) {
            const texto = String(termino || '').trim().toUpperCase();
            if (!texto) {
                return [];
            }
            return this.deps.reservaDAO.filtrar((r) => r.estaActiva()
                && (r.codigo === texto || r.clienteTelefono === texto))
                .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
        }

        /**
         * Contrato: Cobra el saldo restante y registra el ingreso del equipo
         * @param {string} codigo Código de la reserva
         * @param {string} metodoPago Medio de pago en recepción (EFECTIVO, TRANSFERENCIA, TARJETA, NEQUI)
         * @param {Date} [ahora=new Date()]
         * @returns {{reserva: Reserva, cobrado: number}}
         * @throws {Error} Si la reserva no existe, no está confirmada o no es del día
         */
        registrarIngreso(codigo, metodoPago, ahora = new Date()) {
            const reserva = this.deps.reservas.obtenerPorCodigo(codigo);
            if (reserva.estado === Reserva.ESTADOS.INGRESADA) {
                throw new Error(`La reserva ${reserva.codigo} ya registró ingreso a las ${reserva.horaIngreso}`);
            }
            if (reserva.estado !== Reserva.ESTADOS.CONFIRMADA) {
                throw new Error(`La reserva ${reserva.codigo} está ${reserva.estado.toLowerCase()} y no permite ingreso`);
            }
            if (reserva.fecha !== Fechas.hoy(ahora)) {
                throw new Error(`El ingreso solo se registra el día del turno (${reserva.fecha})`);
            }
            const cobrado = reserva.saldoPendiente;
            if (cobrado > 0) {
                this.deps.reservas.validarMetodo(metodoPago, ReservaController.METODOS_TAQUILLA);
                this.deps.reservas.registrarPago(reserva, Pago.TIPOS.SALDO, cobrado, metodoPago, ahora);
            }
            const marca = `${Fechas.hoy(ahora)} ${Fechas.horaActual(ahora)}`;
            this.deps.reservaDAO.actualizar(reserva.id, {
                pagado: reserva.valorTotal,
                estado: Reserva.ESTADOS.INGRESADA,
                horaIngreso: Fechas.horaActual(ahora),
                historial: [...reserva.historial, `${marca} - Ingreso registrado, saldo cobrado: $${cobrado}`]
            });
            return { reserva, cobrado };
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AccesoController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).AccesoController = AccesoController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
