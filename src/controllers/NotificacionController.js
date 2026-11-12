/**
 * Controlador (Facade) de Notificaciones Automáticas de Confirmación y Recordatorio (HU09)
 * Simula la integración con WhatsApp Business API: los mensajes quedan en la bandeja de salida.
 * Los demás controladores lo usan a través de deps.notificador (dependencia opcional).
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Fechas = importar('../utils/Fechas', 'Fechas');
    const Reserva = importar('../models/Reserva', 'Reserva');
    const Notificacion = importar('../models/Notificacion', 'Notificacion');

    /** Horas antes del turno en que se envía el recordatorio */
    const HORAS_RECORDATORIO = 24;

    class NotificacionController {
        /**
         * @param {Object} deps Dependencias: notificacionDAO, reservaDAO y canchaDAO
         */
        constructor(deps) {
            this.deps = deps;
        }

        /**
         * Contrato: Genera y "envía" un mensaje de WhatsApp al cliente de una reserva
         * @param {string} tipo Uno de Notificacion.TIPOS
         * @param {Reserva} reserva
         * @param {string} [detalle=''] Información adicional del evento
         * @param {Date} [ahora=new Date()]
         * @returns {Notificacion}
         */
        notificar(tipo, reserva, detalle = '', ahora = new Date()) {
            if (!Notificacion.TIPOS[tipo]) {
                throw new Error(`Tipo de notificación no válido: ${tipo}`);
            }
            const notificacion = new Notificacion({
                id: this.deps.notificacionDAO.siguienteId(),
                tipo,
                canal: 'WHATSAPP',
                destinatario: reserva.clienteTelefono,
                mensaje: this.redactar(tipo, reserva, detalle),
                reservaId: reserva.id,
                fecha: Fechas.hoy(ahora),
                hora: Fechas.horaActual(ahora)
            });
            return this.deps.notificacionDAO.guardar(notificacion);
        }

        /**
         * Contrato: Envía recordatorios a las reservas confirmadas que inician en las próximas 24 h
         * @param {Date} [ahora=new Date()]
         * @returns {Array<Notificacion>} Recordatorios enviados en esta ejecución
         */
        generarRecordatorios(ahora = new Date()) {
            const pendientes = this.deps.reservaDAO.filtrar((r) => {
                const horas = Fechas.horasHasta(r.fecha, r.hora, ahora);
                return r.estado === Reserva.ESTADOS.CONFIRMADA && !r.recordatorioEnviado
                    && horas > 0 && horas <= HORAS_RECORDATORIO;
            });
            return pendientes.map((reserva) => {
                this.deps.reservaDAO.actualizar(reserva.id, { recordatorioEnviado: true });
                return this.notificar('RECORDATORIO', reserva, '', ahora);
            });
        }

        /**
         * Contrato: Bandeja de salida, de la más reciente a la más antigua
         * @param {string} [telefono] Filtra por destinatario
         * @returns {Array<Notificacion>}
         */
        listar(telefono) {
            return this.deps.notificacionDAO
                .filtrar((n) => !telefono || n.destinatario === String(telefono).trim())
                .slice()
                .sort((a, b) => b.id - a.id);
        }

        /**
         * Contrato: Redacta el mensaje según la plantilla del tipo de notificación
         * @param {string} tipo
         * @param {Reserva} reserva
         * @param {string} detalle
         * @returns {string}
         */
        redactar(tipo, reserva, detalle) {
            const cancha = this.deps.canchaDAO.buscarPorId(reserva.canchaId);
            const nombreCancha = cancha ? `${cancha.nombre} (${cancha.tipo})` : `Cancha ${reserva.canchaId}`;
            const turno = `${Fechas.nombreDia(reserva.fecha)} ${reserva.fecha} a las ${Fechas.formatoHora(reserva.hora)}`;
            const saldo = `$${reserva.saldoPendiente.toLocaleString('es-CO')}`;
            const plantillas = {
                CONFIRMACION: `Hola ${reserva.clienteNombre}, tu reserva ${reserva.codigo} está CONFIRMADA: ${nombreCancha}, ${turno}. `
                    + `Saldo a pagar en la cancha: ${saldo}. Presenta este código en recepción 10 minutos antes.`,
                RECORDATORIO: `Recordatorio CanchaGO: ${reserva.clienteNombre}, tu partido es el ${turno} en ${nombreCancha}. `
                    + `Código ${reserva.codigo}. Saldo pendiente: ${saldo}. ¡Te esperamos!`,
                CANCELACION: `Tu reserva ${reserva.codigo} (${turno}) fue cancelada: ${detalle}.`,
                REAGENDAMIENTO: `Tu reserva ${reserva.codigo} fue reagendada para el ${turno} en ${nombreCancha} (${detalle}).`,
                BLOQUEO: `Lo sentimos, ${nombreCancha} fue bloqueada el ${turno} por ${detalle}. `
                    + `Tu reserva ${reserva.codigo} se canceló y el valor pagado quedó como saldo a favor.`
            };
            return plantillas[tipo];
        }
    }

    NotificacionController.HORAS_RECORDATORIO = HORAS_RECORDATORIO;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = NotificacionController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).NotificacionController = NotificacionController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
