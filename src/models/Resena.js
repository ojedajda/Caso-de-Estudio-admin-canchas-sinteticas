/**
 * Modelo de datos que representa la Calificación y Reseña de un servicio (HU11)
 */
(function (global) {
    'use strict';

    class Resena {
        /**
         * @param {Object} datos
         * @param {number} datos.id
         * @param {number} datos.reservaId
         * @param {number} datos.canchaId
         * @param {string} datos.cliente Nombre del cliente
         * @param {number} datos.calificacion Estrellas de 1 a 5
         * @param {string} [datos.comentario='']
         * @param {string} datos.fecha 'AAAA-MM-DD'
         */
        constructor(datos = {}) {
            this.id = datos.id;
            this.reservaId = datos.reservaId;
            this.canchaId = datos.canchaId;
            this.cliente = datos.cliente;
            this.calificacion = datos.calificacion;
            this.comentario = datos.comentario || '';
            this.fecha = datos.fecha;
        }

        /**
         * Contrato: Reconstruye una Reseña a partir de un objeto plano
         * @param {Object} obj
         * @returns {Resena}
         */
        static desde(obj) {
            return new Resena(obj);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Resena;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).Resena = Resena;
    }
})(typeof window !== 'undefined' ? window : globalThis);
