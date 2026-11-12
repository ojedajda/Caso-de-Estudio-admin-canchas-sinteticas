/**
 * Clase DAO para la persistencia de Clientes (HU02)
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Cliente = importar('../models/Cliente', 'Cliente');
    const RepositorioBase = importar('./RepositorioBase', 'RepositorioBase');

    class ClienteDAO extends RepositorioBase {
        /** @param {Object|null} [almacen=null] */
        constructor(almacen = null) {
            super(almacen, 'clientes', Cliente);
        }

        /**
         * Contrato de método: Busca un cliente por su teléfono
         * @param {string} telefono
         * @returns {Cliente|undefined}
         */
        buscarPorTelefono(telefono) {
            return this.registros.find((c) => c.telefono === String(telefono).trim());
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ClienteDAO;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).ClienteDAO = ClienteDAO;
    }
})(typeof window !== 'undefined' ? window : globalThis);
