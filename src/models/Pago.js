/**
 * Modelo de datos que representa un movimiento de caja (HU02 / HU06 / HU07)
 * Tipos: ANTICIPO, SALDO, TOTAL, REEMBOLSO (monto negativo) y SALDO_A_FAVOR (uso de crédito, no es caja).
 */
(function (global) {
    'use strict';

    const TIPOS = {
        ANTICIPO: 'ANTICIPO',
        SALDO: 'SALDO',
        TOTAL: 'TOTAL',
        REEMBOLSO: 'REEMBOLSO',
        SALDO_A_FAVOR: 'SALDO_A_FAVOR'
    };

    class Pago {
        /**
         * @param {Object} datos
         * @param {number} datos.id
         * @param {number} datos.reservaId
         * @param {string} datos.codigoReserva
         * @param {string} datos.tipo Uno de Pago.TIPOS
         * @param {number} datos.monto Valor en COP (negativo en reembolsos)
         * @param {string} datos.metodo TARJETA, PSE, NEQUI, EFECTIVO, TRANSFERENCIA o SALDO_A_FAVOR
         * @param {string} datos.fecha Fecha del movimiento 'AAAA-MM-DD'
         * @param {string} datos.hora Hora del movimiento 'HH:MM'
         * @param {string} [datos.referencia] Referencia de la transacción
         */
        constructor(datos = {}) {
            this.id = datos.id;
            this.reservaId = datos.reservaId;
            this.codigoReserva = datos.codigoReserva;
            this.tipo = datos.tipo;
            this.monto = datos.monto;
            this.metodo = datos.metodo;
            this.fecha = datos.fecha;
            this.hora = datos.hora;
            this.referencia = datos.referencia || '';
        }

        /**
         * Contrato: Indica si el movimiento entra o sale de la caja del establecimiento
         * @returns {boolean}
         */
        esMovimientoDeCaja() {
            return this.tipo !== TIPOS.SALDO_A_FAVOR;
        }

        /**
         * Contrato: Reconstruye un Pago a partir de un objeto plano
         * @param {Object} obj
         * @returns {Pago}
         */
        static desde(obj) {
            return new Pago(obj);
        }
    }

    Pago.TIPOS = TIPOS;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Pago;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).Pago = Pago;
    }
})(typeof window !== 'undefined' ? window : globalThis);
