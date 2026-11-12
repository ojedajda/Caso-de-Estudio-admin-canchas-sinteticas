/**
 * Clase DAO para la persistencia de Notificaciones (HU09)
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Notificacion = importar('../models/Notificacion', 'Notificacion');
    const RepositorioBase = importar('./RepositorioBase', 'RepositorioBase');

    class NotificacionDAO extends RepositorioBase {
        /** @param {Object|null} [almacen=null] */
        constructor(almacen = null) {
            super(almacen, 'notificaciones', Notificacion);
        }

        /**
         * Contrato de método: Notificaciones de una reserva
         * @param {number} reservaId
         * @returns {Array<Notificacion>}
         */
        buscarPorReserva(reservaId) {
            return this.filtrar((n) => n.reservaId === reservaId);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = NotificacionDAO;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).NotificacionDAO = NotificacionDAO;
    }
})(typeof window !== 'undefined' ? window : globalThis);
