/**
 * Modelo de datos que representa la entidad Cliente (HU02)
 * El teléfono identifica al cliente; el saldo a favor se genera por cancelaciones (HU03) o bloqueos (HU12).
 */
(function (global) {
    'use strict';

    class Cliente {
        /**
         * @param {number} id
         * @param {string} nombre
         * @param {string} telefono Celular de 10 dígitos
         * @param {number} [saldoAFavor=0] Crédito disponible para próximas reservas (COP)
         */
        constructor(id, nombre, telefono, saldoAFavor = 0) {
            this.id = id;
            this.nombre = nombre;
            this.telefono = telefono;
            this.saldoAFavor = saldoAFavor;
        }

        /**
         * Contrato: Reconstruye un Cliente a partir de un objeto plano
         * @param {Object} obj
         * @returns {Cliente}
         */
        static desde(obj) {
            return new Cliente(obj.id, obj.nombre, obj.telefono, obj.saldoAFavor || 0);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Cliente;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).Cliente = Cliente;
    }
})(typeof window !== 'undefined' ? window : globalThis);
