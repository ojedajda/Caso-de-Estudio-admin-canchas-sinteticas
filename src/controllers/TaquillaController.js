/**
 * Controlador (Facade) de Registro Manual de Reservas Presenciales o Telefónicas (HU08)
 * Usa el mismo motor de reservas que la web, así las reservas de taquilla bloquean
 * la agenda de inmediato y no se cruzan con los turnos vendidos en línea.
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Fechas = importar('../utils/Fechas', 'Fechas');

    const CANALES_TAQUILLA = ['PRESENCIAL', 'TELEFONICA'];

    class TaquillaController {
        /**
         * @param {Object} deps Dependencias: reservas (ReservaController), pagoDAO y canchaDAO
         */
        constructor(deps) {
            this.deps = deps;
        }

        /**
         * Contrato: Registra una reserva tomada en recepción o por teléfono y genera su recibo
         * @param {Object} datos Mismos campos de ReservaController.crearReserva
         * @param {string} datos.canal PRESENCIAL o TELEFONICA
         * @param {Date} [ahora=new Date()]
         * @returns {{reserva: Object, recibo: Object}}
         * @throws {Error} Si el canal no es de taquilla o la reserva no es válida
         */
        registrar(datos, ahora = new Date()) {
            if (!CANALES_TAQUILLA.includes(datos.canal)) {
                throw new Error('El canal debe ser PRESENCIAL o TELEFONICA');
            }
            const reserva = this.deps.reservas.crearReserva(datos, ahora);
            return { reserva, recibo: this.generarRecibo(reserva.codigo, ahora) };
        }

        /**
         * Contrato: Genera el recibo de una reserva con todos sus pagos
         * @param {string} codigo
         * @param {Date} [ahora=new Date()]
         * @returns {Object} Datos del recibo listos para imprimir
         * @throws {Error} Si la reserva no existe
         */
        generarRecibo(codigo, ahora = new Date()) {
            const reserva = this.deps.reservas.obtenerPorCodigo(codigo);
            const cancha = this.deps.canchaDAO.buscarPorId(reserva.canchaId);
            return {
                numero: `REC-${reserva.codigo}`,
                emitido: `${Fechas.hoy(ahora)} ${Fechas.horaActual(ahora)}`,
                codigo: reserva.codigo,
                cliente: reserva.clienteNombre,
                telefono: reserva.clienteTelefono,
                canal: reserva.canal,
                cancha: cancha ? `${cancha.nombre} (${cancha.tipo})` : `Cancha ${reserva.canchaId}`,
                fecha: reserva.fecha,
                hora: Fechas.formatoHora(reserva.hora),
                valorTarifa: reserva.valorTarifa,
                descuento: reserva.descuento,
                valorTotal: reserva.valorTotal,
                pagado: reserva.pagado,
                saldoPendiente: reserva.saldoPendiente,
                pagos: this.deps.pagoDAO.buscarPorReserva(reserva.id)
            };
        }
    }

    TaquillaController.CANALES = CANALES_TAQUILLA;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TaquillaController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).TaquillaController = TaquillaController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
