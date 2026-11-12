/**
 * Clase DAO para la persistencia de Pagos / movimientos de caja (HU02 / HU06)
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Pago = importar('../models/Pago', 'Pago');
    const RepositorioBase = importar('./RepositorioBase', 'RepositorioBase');

    class PagoDAO extends RepositorioBase {
        /** @param {Object|null} [almacen=null] */
        constructor(almacen = null) {
            super(almacen, 'pagos', Pago);
        }

        /**
         * Contrato de método: Movimientos registrados en una fecha
         * @param {string} fecha 'AAAA-MM-DD'
         * @returns {Array<Pago>}
         */
        buscarPorFecha(fecha) {
            return this.filtrar((p) => p.fecha === fecha);
        }

        /**
         * Contrato de método: Movimientos asociados a una reserva
         * @param {number} reservaId
         * @returns {Array<Pago>}
         */
        buscarPorReserva(reservaId) {
            return this.filtrar((p) => p.reservaId === reservaId);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PagoDAO;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).PagoDAO = PagoDAO;
    }
})(typeof window !== 'undefined' ? window : globalThis);
