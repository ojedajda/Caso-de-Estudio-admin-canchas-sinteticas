/**
 * Modelo de datos que representa la entidad Reserva (HU01 / HU02)
 * Una reserva ocupa una cancha durante un turno de 1 hora.
 */
(function (global) {
    'use strict';

    const ESTADOS = {
        CONFIRMADA: 'CONFIRMADA',               // Anticipo pagado, turno asegurado
        INGRESADA: 'INGRESADA',                 // El equipo llegó y pagó el saldo (HU07)
        CANCELADA: 'CANCELADA',                 // Cancelada por el cliente (HU03)
        CANCELADA_BLOQUEO: 'CANCELADA_BLOQUEO'  // Cancelada por bloqueo de emergencia (HU12)
    };

    class Reserva {
        /**
         * @param {Object} datos
         * @param {number} datos.id
         * @param {string} datos.codigo Código visible para el cliente, ej: "CG-0001"
         * @param {number} datos.canchaId
         * @param {string} datos.fecha Fecha del turno 'AAAA-MM-DD'
         * @param {number} datos.hora Hora de inicio del turno (8 a 21)
         * @param {string} datos.clienteNombre
         * @param {string} datos.clienteTelefono
         * @param {string} [datos.canal='WEB'] WEB, PRESENCIAL o TELEFONICA (HU08)
         * @param {number} datos.valorTarifa Tarifa de la franja (COP)
         * @param {number} [datos.descuento=0] Descuento por promoción (HU05)
         * @param {number} datos.valorTotal Valor a pagar = tarifa - descuento
         * @param {number} datos.anticipo Anticipo exigido para confirmar
         * @param {number} [datos.pagado=0] Total pagado hasta el momento
         * @param {string} [datos.estado='CONFIRMADA']
         */
        constructor(datos = {}) {
            this.id = datos.id;
            this.codigo = datos.codigo;
            this.canchaId = datos.canchaId;
            this.fecha = datos.fecha;
            this.hora = datos.hora;
            this.clienteNombre = datos.clienteNombre;
            this.clienteTelefono = datos.clienteTelefono;
            this.canal = datos.canal || 'WEB';
            this.valorTarifa = datos.valorTarifa || 0;
            this.descuento = datos.descuento || 0;
            this.codigoPromocion = datos.codigoPromocion || '';
            this.valorTotal = datos.valorTotal || 0;
            this.anticipo = datos.anticipo || 0;
            this.pagado = datos.pagado || 0;
            this.estado = datos.estado || ESTADOS.CONFIRMADA;
            this.creadaEn = datos.creadaEn || '';
            this.horaIngreso = datos.horaIngreso || '';
            this.recordatorioEnviado = Boolean(datos.recordatorioEnviado);
            this.historial = datos.historial || [];
        }

        /**
         * Contrato: Saldo que el cliente debe pagar al llegar a la cancha
         * @returns {number}
         */
        get saldoPendiente() {
            return Math.max(0, this.valorTotal - this.pagado);
        }

        /**
         * Contrato: Indica si la reserva ocupa la cancha (confirmada o en juego)
         * @returns {boolean}
         */
        estaActiva() {
            return this.estado === ESTADOS.CONFIRMADA || this.estado === ESTADOS.INGRESADA;
        }

        /**
         * Contrato: Reconstruye una Reserva a partir de un objeto plano (persistencia)
         * @param {Object} obj
         * @returns {Reserva}
         */
        static desde(obj) {
            return new Reserva(obj);
        }
    }

    Reserva.ESTADOS = ESTADOS;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Reserva;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).Reserva = Reserva;
    }
})(typeof window !== 'undefined' ? window : globalThis);
