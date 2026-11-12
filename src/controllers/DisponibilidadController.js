/**
 * Controlador (Facade) de Consulta de Disponibilidad de Canchas (HU01)
 * Motor de disponibilidad: calcula el estado de cada franja horaria cruzando
 * canchas, reservas activas y bloqueos de emergencia (si la HU12 está instalada).
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Fechas = importar('../utils/Fechas', 'Fechas');
    const CanchaController = importar('./CanchaController', 'CanchaController');

    const ESTADOS = {
        LIBRE: 'LIBRE',
        RESERVADA: 'RESERVADA',
        BLOQUEADA: 'BLOQUEADA',
        PASADA: 'PASADA',
        INHABILITADA: 'INHABILITADA'
    };

    class DisponibilidadController {
        /**
         * @param {Object} deps Dependencias compartidas: canchaDAO, reservaDAO,
         *   canchaController (opcional) y bloqueoDAO (opcional, HU12)
         */
        constructor(deps) {
            this.deps = deps;
            this.canchas = deps.canchaController || new CanchaController(deps.canchaDAO);
        }

        /**
         * Contrato: Estado de una franja horaria de una cancha
         * @param {Object} cancha
         * @param {string} fecha 'AAAA-MM-DD'
         * @param {number} hora
         * @param {Date} [ahora=new Date()]
         * @param {number|null} [excluirReservaId=null]
         * @returns {{estado: string, reserva?: Object, motivo?: string}}
         */
        estadoFranja(cancha, fecha, hora, ahora = new Date(), excluirReservaId = null) {
            if (!cancha.habilitada) {
                return { estado: ESTADOS.INHABILITADA };
            }
            const bloqueo = this.deps.bloqueoDAO ? this.deps.bloqueoDAO.buscarEn(cancha.id, fecha, hora) : null;
            if (bloqueo) {
                return { estado: ESTADOS.BLOQUEADA, motivo: bloqueo.motivo };
            }
            const reserva = this.deps.reservaDAO.buscarActivaEn(cancha.id, fecha, hora, excluirReservaId);
            if (reserva) {
                return { estado: ESTADOS.RESERVADA, reserva };
            }
            if (Fechas.aDate(fecha, hora) <= ahora) {
                return { estado: ESTADOS.PASADA };
            }
            return { estado: ESTADOS.LIBRE };
        }

        /**
         * Contrato: Consulta la disponibilidad de todas las canchas en una fecha
         * @param {string} fecha 'AAAA-MM-DD'
         * @param {Object} [filtros]
         * @param {string} [filtros.tipo] Filtra por modalidad (ej: "Fútbol 5")
         * @param {Date} [ahora=new Date()]
         * @returns {Array<{cancha: Object, franjas: Array<Object>}>}
         * @throws {Error} Si la fecha no es válida
         */
        consultar(fecha, filtros = {}, ahora = new Date()) {
            this.validarFecha(fecha);
            return this.canchas.listarCanchas()
                .filter((cancha) => !filtros.tipo || cancha.tipo === filtros.tipo)
                .map((cancha) => ({
                    cancha,
                    franjas: Fechas.franjasDelDia().map((hora) => ({
                        hora,
                        tarifa: this.canchas.tarifaFranja(cancha, fecha, hora),
                        horaPico: CanchaController.esHoraPico(hora),
                        ...this.estadoFranja(cancha, fecha, hora, ahora)
                    }))
                }));
        }

        /**
         * Contrato: Horas libres de una cancha en una fecha
         * @param {number} canchaId
         * @param {string} fecha
         * @param {Date} [ahora=new Date()]
         * @param {number|null} [excluirReservaId=null]
         * @returns {Array<number>}
         */
        horasLibres(canchaId, fecha, ahora = new Date(), excluirReservaId = null) {
            if (!Fechas.esFechaValida(fecha)) {
                return [];
            }
            const cancha = this.canchas.obtenerCancha(canchaId);
            return Fechas.franjasDelDia()
                .filter((hora) => this.estadoFranja(cancha, fecha, hora, ahora, excluirReservaId).estado === ESTADOS.LIBRE);
        }

        /**
         * Contrato: Valida que una franja se pueda reservar (control de concurrencia antes de guardar)
         * @param {number} canchaId
         * @param {string} fecha
         * @param {number} hora
         * @param {Date} [ahora=new Date()]
         * @param {number|null} [excluirReservaId=null]
         * @returns {Object} La cancha validada
         * @throws {Error} Con el motivo por el que la franja no está disponible
         */
        validarFranja(canchaId, fecha, hora, ahora = new Date(), excluirReservaId = null) {
            this.validarFecha(fecha);
            const horaNum = Number(hora);
            if (!Fechas.esHoraValida(horaNum)) {
                throw new Error(`La hora debe estar entre las ${Fechas.formatoHora(Fechas.HORA_APERTURA)} y las ${Fechas.formatoHora(Fechas.HORA_CIERRE - 1)}`);
            }
            const cancha = this.canchas.obtenerCancha(Number(canchaId));
            const { estado, motivo } = this.estadoFranja(cancha, fecha, horaNum, ahora, excluirReservaId);
            const mensajes = {
                INHABILITADA: `${cancha.nombre} está inhabilitada para la venta`,
                BLOQUEADA: `${cancha.nombre} está bloqueada en esa franja (${motivo})`,
                RESERVADA: `${cancha.nombre} ya está reservada el ${fecha} a las ${Fechas.formatoHora(horaNum)}`,
                PASADA: 'No se puede reservar una franja que ya pasó'
            };
            if (estado !== ESTADOS.LIBRE) {
                throw new Error(mensajes[estado]);
            }
            return cancha;
        }

        /**
         * Contrato: Resumen de ocupación de una fecha
         * @param {string} fecha
         * @param {Date} [ahora=new Date()]
         * @returns {{libres: number, reservadas: number, bloqueadas: number, total: number, ocupacion: number}}
         */
        resumen(fecha, ahora = new Date()) {
            const conteo = { libres: 0, reservadas: 0, bloqueadas: 0, total: 0 };
            this.consultar(fecha, {}, ahora).forEach(({ cancha, franjas }) => {
                if (!cancha.habilitada) {
                    return;
                }
                franjas.forEach((f) => {
                    conteo.total += 1;
                    if (f.estado === ESTADOS.LIBRE) conteo.libres += 1;
                    if (f.estado === ESTADOS.RESERVADA) conteo.reservadas += 1;
                    if (f.estado === ESTADOS.BLOQUEADA) conteo.bloqueadas += 1;
                });
            });
            conteo.ocupacion = conteo.total ? Math.round((conteo.reservadas / conteo.total) * 1000) / 10 : 0;
            return conteo;
        }

        /**
         * Contrato: Valida el formato de la fecha
         * @param {string} fecha
         * @throws {Error} Si la fecha no es válida
         */
        validarFecha(fecha) {
            if (!Fechas.esFechaValida(fecha)) {
                throw new Error('La fecha debe tener el formato AAAA-MM-DD');
            }
        }
    }

    DisponibilidadController.ESTADOS = ESTADOS;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DisponibilidadController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).DisponibilidadController = DisponibilidadController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
