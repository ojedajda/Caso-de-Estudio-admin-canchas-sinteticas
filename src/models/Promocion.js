/**
 * Modelo de datos que representa una Promoción o cupón de descuento (HU05)
 */
(function (global) {
    'use strict';

    class Promocion {
        /**
         * @param {Object} datos
         * @param {number} datos.id
         * @param {string} datos.codigo Código del cupón en mayúsculas, ej: "MANANERO20"
         * @param {string} datos.descripcion
         * @param {string} datos.tipo PORCENTAJE o MONTO
         * @param {number} datos.valor Porcentaje (1-90) o monto fijo en COP
         * @param {string} datos.fechaInicio 'AAAA-MM-DD'
         * @param {string} datos.fechaFin 'AAAA-MM-DD'
         * @param {boolean} [datos.soloHorarioValle=false] Solo aplica fuera de hora pico, domingos y festivos
         * @param {boolean} [datos.activa=true]
         * @param {number} [datos.usos=0] Veces que se ha aplicado
         */
        constructor(datos = {}) {
            this.id = datos.id;
            this.codigo = datos.codigo;
            this.descripcion = datos.descripcion || '';
            this.tipo = datos.tipo;
            this.valor = datos.valor;
            this.fechaInicio = datos.fechaInicio;
            this.fechaFin = datos.fechaFin;
            this.soloHorarioValle = Boolean(datos.soloHorarioValle);
            this.activa = datos.activa !== false;
            this.usos = datos.usos || 0;
        }

        /**
         * Contrato: Reconstruye una Promoción a partir de un objeto plano
         * @param {Object} obj
         * @returns {Promocion}
         */
        static desde(obj) {
            return new Promocion(obj);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Promocion;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).Promocion = Promocion;
    }
})(typeof window !== 'undefined' ? window : globalThis);
