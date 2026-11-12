/**
 * Clase DAO para la persistencia de Bloqueos de emergencia (HU12)
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Bloqueo = importar('../models/Bloqueo', 'Bloqueo');
    const RepositorioBase = importar('./RepositorioBase', 'RepositorioBase');

    class BloqueoDAO extends RepositorioBase {
        /** @param {Object|null} [almacen=null] */
        constructor(almacen = null) {
            super(almacen, 'bloqueos', Bloqueo);
        }

        /**
         * Contrato de método: Bloqueo que cubre una cancha en una franja
         * @param {number} canchaId
         * @param {string} fecha
         * @param {number} hora
         * @returns {Bloqueo|undefined}
         */
        buscarEn(canchaId, fecha, hora) {
            return this.registros.find((b) => b.canchaId === Number(canchaId) && b.fecha === fecha && b.cubre(hora));
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BloqueoDAO;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).BloqueoDAO = BloqueoDAO;
    }
})(typeof window !== 'undefined' ? window : globalThis);
