/**
 * Controlador (Facade) de Bloqueo de Emergencia por Mantenimiento o Imprevistos (HU12)
 * Al bloquear una franja se cancelan las reservas afectadas, se devuelve el 100 % de lo pagado
 * como saldo a favor y se notifica a los clientes (si la HU09 está instalada).
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Fechas = importar('../utils/Fechas', 'Fechas');
    const Reserva = importar('../models/Reserva', 'Reserva');
    const Bloqueo = importar('../models/Bloqueo', 'Bloqueo');

    class BloqueoController {
        /**
         * @param {Object} deps Dependencias: bloqueoDAO, reservaDAO, clienteDAO, canchaController y notificador (opcional)
         */
        constructor(deps) {
            this.deps = deps;
        }

        /**
         * Contrato: Bloquea una cancha en un rango de horas de una fecha
         * @param {Object} datos
         * @param {number} datos.canchaId
         * @param {string} datos.fecha
         * @param {number} datos.horaInicio
         * @param {number} datos.horaFin Hora de fin (no incluida); máximo la hora de cierre
         * @param {string} datos.motivo
         * @param {Date} [ahora=new Date()]
         * @returns {{bloqueo: Bloqueo, afectadas: Array<Reserva>}}
         * @throws {Error} Si los datos no son válidos o se cruza con otro bloqueo
         */
        bloquear(datos, ahora = new Date()) {
            const canchaId = Number(datos.canchaId);
            const horaInicio = Number(datos.horaInicio);
            const horaFin = Number(datos.horaFin);
            const motivo = String(datos.motivo || '').trim();
            const cancha = this.deps.canchaController.obtenerCancha(canchaId);
            if (!Fechas.esFechaValida(datos.fecha)) {
                throw new Error('La fecha debe tener el formato AAAA-MM-DD');
            }
            if (!Fechas.esHoraValida(horaInicio) || horaFin <= horaInicio || horaFin > Fechas.HORA_CIERRE) {
                throw new Error('El rango de horas no es válido');
            }
            if (Fechas.horasHasta(datos.fecha, horaFin, ahora) <= 0) {
                throw new Error('No se puede bloquear una franja que ya terminó');
            }
            if (motivo.length < 4) {
                throw new Error('Describe el motivo del bloqueo (mínimo 4 caracteres)');
            }
            for (let h = horaInicio; h < horaFin; h++) {
                if (this.deps.bloqueoDAO.buscarEn(canchaId, datos.fecha, h)) {
                    throw new Error(`${cancha.nombre} ya tiene un bloqueo a las ${Fechas.formatoHora(h)}`);
                }
            }
            const bloqueo = this.deps.bloqueoDAO.guardar(new Bloqueo({
                id: this.deps.bloqueoDAO.siguienteId(),
                canchaId,
                fecha: datos.fecha,
                horaInicio,
                horaFin,
                motivo,
                creadoEn: `${Fechas.hoy(ahora)} ${Fechas.horaActual(ahora)}`
            }));
            const afectadas = this.deps.reservaDAO.filtrar((r) => r.canchaId === canchaId && r.fecha === datos.fecha
                && r.estado === Reserva.ESTADOS.CONFIRMADA && bloqueo.cubre(r.hora));
            afectadas.forEach((reserva) => this.cancelarPorBloqueo(reserva, motivo, ahora));
            return { bloqueo, afectadas };
        }

        /**
         * Contrato: Cancela una reserva afectada y devuelve lo pagado como saldo a favor
         * @param {Reserva} reserva
         * @param {string} motivo
         * @param {Date} ahora
         */
        cancelarPorBloqueo(reserva, motivo, ahora) {
            const cliente = this.deps.clienteDAO ? this.deps.clienteDAO.buscarPorTelefono(reserva.clienteTelefono) : null;
            if (cliente && reserva.pagado > 0) {
                this.deps.clienteDAO.actualizar(cliente.id, { saldoAFavor: cliente.saldoAFavor + reserva.pagado });
            }
            this.deps.reservaDAO.actualizar(reserva.id, {
                estado: Reserva.ESTADOS.CANCELADA_BLOQUEO,
                historial: [...reserva.historial,
                    `${Fechas.hoy(ahora)} ${Fechas.horaActual(ahora)} - Cancelada por bloqueo (${motivo}), $${reserva.pagado} a saldo a favor`]
            });
            if (this.deps.notificador) {
                this.deps.notificador.notificar('BLOQUEO', reserva, motivo, ahora);
            }
        }

        /**
         * Contrato: Levanta (elimina) un bloqueo; las reservas canceladas no se restauran
         * @param {number} id
         * @returns {boolean}
         * @throws {Error} Si el bloqueo no existe
         */
        levantar(id) {
            if (!this.deps.bloqueoDAO.eliminar(id)) {
                throw new Error(`No existe un bloqueo con id ${id}`);
            }
            return true;
        }

        /**
         * Contrato: Bloqueos vigentes desde una fecha
         * @param {string} [desde] Fecha mínima 'AAAA-MM-DD' (por defecto hoy)
         * @returns {Array<Bloqueo>}
         */
        listar(desde = Fechas.hoy()) {
            return this.deps.bloqueoDAO.filtrar((b) => b.fecha >= desde)
                .sort((a, b) => (a.fecha + String(a.horaInicio).padStart(2, '0')).localeCompare(b.fecha + String(b.horaInicio).padStart(2, '0')));
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BloqueoController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).BloqueoController = BloqueoController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
