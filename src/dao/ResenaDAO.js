/**
 * Clase DAO para la persistencia de Reseñas (HU11)
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Resena = importar('../models/Resena', 'Resena');
    const RepositorioBase = importar('./RepositorioBase', 'RepositorioBase');

    class ResenaDAO extends RepositorioBase {
        /** @param {Object|null} [almacen=null] */
        constructor(almacen = null) {
            super(almacen, 'resenas', Resena);
        }

        /**
         * Contrato de método: Reseña asociada a una reserva
         * @param {number} reservaId
         * @returns {Resena|undefined}
         */
        buscarPorReserva(reservaId) {
            return this.registros.find((r) => r.reservaId === reservaId);
        }

        /**
         * Contrato de método: Reseñas de una cancha
         * @param {number} canchaId
         * @returns {Array<Resena>}
         */
        buscarPorCancha(canchaId) {
            return this.filtrar((r) => r.canchaId === Number(canchaId));
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ResenaDAO;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).ResenaDAO = ResenaDAO;
    }
})(typeof window !== 'undefined' ? window : globalThis);
