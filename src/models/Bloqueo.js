/**
 * Modelo de datos que representa un Bloqueo de emergencia de una cancha (HU12)
 * Bloquea la franja [horaInicio, horaFin) de una fecha por mantenimiento, lluvia u otro imprevisto.
 */
(function (global) {
    'use strict';

    class Bloqueo {
        /**
         * @param {Object} datos
         * @param {number} datos.id
         * @param {number} datos.canchaId
         * @param {string} datos.fecha 'AAAA-MM-DD'
         * @param {number} datos.horaInicio Primera hora bloqueada
         * @param {number} datos.horaFin Hora en que termina el bloqueo (no incluida)
         * @param {string} datos.motivo
         * @param {string} [datos.creadoEn]
         */
        constructor(datos = {}) {
            this.id = datos.id;
            this.canchaId = datos.canchaId;
            this.fecha = datos.fecha;
            this.horaInicio = datos.horaInicio;
            this.horaFin = datos.horaFin;
            this.motivo = datos.motivo;
            this.creadoEn = datos.creadoEn || '';
        }

        /**
         * Contrato: Indica si el bloqueo cubre una hora determinada
         * @param {number} hora
         * @returns {boolean}
         */
        cubre(hora) {
            return hora >= this.horaInicio && hora < this.horaFin;
        }

        /**
         * Contrato: Reconstruye un Bloqueo a partir de un objeto plano
         * @param {Object} obj
         * @returns {Bloqueo}
         */
        static desde(obj) {
            return new Bloqueo(obj);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Bloqueo;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).Bloqueo = Bloqueo;
    }
})(typeof window !== 'undefined' ? window : globalThis);
