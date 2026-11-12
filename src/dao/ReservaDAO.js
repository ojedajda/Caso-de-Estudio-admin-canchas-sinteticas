/**
 * Clase DAO para la persistencia y consulta de Reservas (HU01)
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Reserva = importar('../models/Reserva', 'Reserva');
    const RepositorioBase = importar('./RepositorioBase', 'RepositorioBase');

    class ReservaDAO extends RepositorioBase {
        /** @param {Object|null} [almacen=null] */
        constructor(almacen = null) {
            super(almacen, 'reservas', Reserva);
        }

        /**
         * Contrato de método: Busca una reserva por su código (sin distinguir mayúsculas)
         * @param {string} codigo ej: "CG-0001"
         * @returns {Reserva|undefined}
         */
        buscarPorCodigo(codigo) {
            const buscado = String(codigo || '').trim().toUpperCase();
            return this.registros.find((r) => r.codigo === buscado);
        }

        /**
         * Contrato de método: Reserva activa (confirmada o ingresada) de una cancha en una franja
         * @param {number} canchaId
         * @param {string} fecha
         * @param {number} hora
         * @param {number|null} [excluirId=null] Reserva a ignorar (útil al reagendar)
         * @returns {Reserva|undefined}
         */
        buscarActivaEn(canchaId, fecha, hora, excluirId = null) {
            return this.registros.find((r) => r.canchaId === Number(canchaId) && r.fecha === fecha
                && r.hora === Number(hora) && r.estaActiva() && r.id !== excluirId);
        }

        /**
         * Contrato de método: Reservas de un cliente por su teléfono
         * @param {string} telefono
         * @returns {Array<Reserva>}
         */
        buscarPorTelefono(telefono) {
            return this.filtrar((r) => r.clienteTelefono === String(telefono).trim());
        }

        /**
         * Contrato de método: Reservas de una fecha
         * @param {string} fecha
         * @returns {Array<Reserva>}
         */
        buscarPorFecha(fecha) {
            return this.filtrar((r) => r.fecha === fecha);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ReservaDAO;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).ReservaDAO = ReservaDAO;
    }
})(typeof window !== 'undefined' ? window : globalThis);
