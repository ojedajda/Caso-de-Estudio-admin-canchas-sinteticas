/**
 * Clase DAO para la persistencia de Promociones (HU05)
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Promocion = importar('../models/Promocion', 'Promocion');
    const RepositorioBase = importar('./RepositorioBase', 'RepositorioBase');

    class PromocionDAO extends RepositorioBase {
        /** @param {Object|null} [almacen=null] */
        constructor(almacen = null) {
            super(almacen, 'promociones', Promocion);
        }

        /**
         * Contrato de método: Busca una promoción por su código
         * @param {string} codigo
         * @returns {Promocion|undefined}
         */
        buscarPorCodigo(codigo) {
            const buscado = String(codigo || '').trim().toUpperCase();
            return this.registros.find((p) => p.codigo === buscado);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PromocionDAO;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).PromocionDAO = PromocionDAO;
    }
})(typeof window !== 'undefined' ? window : globalThis);
