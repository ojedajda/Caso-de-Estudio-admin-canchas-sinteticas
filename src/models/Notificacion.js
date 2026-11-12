/**
 * Modelo de datos que representa una Notificación enviada al cliente (HU09)
 * El envío por WhatsApp Business API se simula registrando el mensaje en la bandeja.
 */
(function (global) {
    'use strict';

    const TIPOS = {
        CONFIRMACION: 'CONFIRMACION',
        RECORDATORIO: 'RECORDATORIO',
        CANCELACION: 'CANCELACION',
        REAGENDAMIENTO: 'REAGENDAMIENTO',
        BLOQUEO: 'BLOQUEO'
    };

    class Notificacion {
        /**
         * @param {Object} datos
         * @param {number} datos.id
         * @param {string} datos.tipo Uno de Notificacion.TIPOS
         * @param {string} datos.canal WHATSAPP
         * @param {string} datos.destinatario Teléfono del cliente
         * @param {string} datos.mensaje
         * @param {number} datos.reservaId
         * @param {string} datos.fecha 'AAAA-MM-DD'
         * @param {string} datos.hora 'HH:MM'
         */
        constructor(datos = {}) {
            this.id = datos.id;
            this.tipo = datos.tipo;
            this.canal = datos.canal || 'WHATSAPP';
            this.destinatario = datos.destinatario;
            this.mensaje = datos.mensaje;
            this.reservaId = datos.reservaId;
            this.fecha = datos.fecha;
            this.hora = datos.hora;
        }

        /**
         * Contrato: Reconstruye una Notificación a partir de un objeto plano
         * @param {Object} obj
         * @returns {Notificacion}
         */
        static desde(obj) {
            return new Notificacion(obj);
        }
    }

    Notificacion.TIPOS = TIPOS;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Notificacion;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).Notificacion = Notificacion;
    }
})(typeof window !== 'undefined' ? window : globalThis);
