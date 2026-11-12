/**
 * Utilidades de fecha y calendario de CanchaGO (HU01 - arquitectura base).
 * Las fechas de negocio se manejan como texto 'AAAA-MM-DD' y las horas como enteros (0-23).
 * Módulo compatible con Node (CommonJS) y con el navegador (window.CanchaGO).
 */
(function (global) {
    'use strict';

    /** Festivos nacionales de Colombia 2026 (Ley 51 de 1983 - Ley Emiliani). */
    const FESTIVOS = [
        '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
        '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
        '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25'
    ];
    const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

    const Fechas = {
        /** Hora de apertura de las canchas (formato 24 h) */
        HORA_APERTURA: 8,
        /** Hora de cierre: el último turno inicia a las 21:00 */
        HORA_CIERRE: 22,

        /**
         * Contrato: Convierte un Date a texto 'AAAA-MM-DD' (hora local)
         * @param {Date} d
         * @returns {string}
         */
        aISO(d) {
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${d.getFullYear()}-${mm}-${dd}`;
        },

        /**
         * Contrato: Fecha actual en formato 'AAAA-MM-DD'
         * @param {Date} [ahora=new Date()]
         * @returns {string}
         */
        hoy(ahora = new Date()) {
            return Fechas.aISO(ahora);
        },

        /**
         * Contrato: Construye un Date local a partir de una fecha 'AAAA-MM-DD' y una hora
         * @param {string} fecha
         * @param {number} [hora=0]
         * @returns {Date}
         */
        aDate(fecha, hora = 0) {
            const [y, m, d] = String(fecha).split('-').map(Number);
            return new Date(y, m - 1, d, hora, 0, 0, 0);
        },

        /**
         * Contrato: Suma (o resta) días a una fecha
         * @param {string} fecha
         * @param {number} dias
         * @returns {string}
         */
        sumarDias(fecha, dias) {
            const d = Fechas.aDate(fecha);
            d.setDate(d.getDate() + dias);
            return Fechas.aISO(d);
        },

        /**
         * Contrato: Indica si la fecha tiene formato válido 'AAAA-MM-DD'
         * @param {string} fecha
         * @returns {boolean}
         */
        esFechaValida(fecha) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
                return false;
            }
            return Fechas.aISO(Fechas.aDate(fecha)) === fecha;
        },

        /**
         * Contrato: Indica si la fecha es festivo nacional
         * @param {string} fecha
         * @returns {boolean}
         */
        esFestivo(fecha) {
            return FESTIVOS.includes(fecha);
        },

        /**
         * Contrato: Indica si la fecha es domingo o festivo (aplica tarifa de festivo)
         * @param {string} fecha
         * @returns {boolean}
         */
        esDomingoOFestivo(fecha) {
            return Fechas.aDate(fecha).getDay() === 0 || Fechas.esFestivo(fecha);
        },

        /**
         * Contrato: Horas que faltan para el inicio de un turno
         * @param {string} fecha
         * @param {number} hora
         * @param {Date} [ahora=new Date()]
         * @returns {number} Horas (negativo si ya pasó)
         */
        horasHasta(fecha, hora, ahora = new Date()) {
            return (Fechas.aDate(fecha, hora).getTime() - ahora.getTime()) / 3600000;
        },

        /**
         * Contrato: Lista de horas de inicio de los turnos del día
         * @returns {Array<number>} ej: [8, 9, ..., 21]
         */
        franjasDelDia() {
            const horas = [];
            for (let h = Fechas.HORA_APERTURA; h < Fechas.HORA_CIERRE; h++) {
                horas.push(h);
            }
            return horas;
        },

        /**
         * Contrato: Indica si la hora corresponde a un turno válido
         * @param {number} hora
         * @returns {boolean}
         */
        esHoraValida(hora) {
            return Number.isInteger(hora) && hora >= Fechas.HORA_APERTURA && hora < Fechas.HORA_CIERRE;
        },

        /**
         * Contrato: Formato de hora 'HH:00'
         * @param {number} hora
         * @returns {string}
         */
        formatoHora(hora) {
            return `${String(hora).padStart(2, '0')}:00`;
        },

        /**
         * Contrato: Hora actual en formato 'HH:MM'
         * @param {Date} [ahora=new Date()]
         * @returns {string}
         */
        horaActual(ahora = new Date()) {
            return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
        },

        /**
         * Contrato: Nombre del día de la semana
         * @param {string} fecha
         * @returns {string} ej: 'martes'
         */
        nombreDia(fecha) {
            return DIAS[Fechas.aDate(fecha).getDay()];
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Fechas;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).Fechas = Fechas;
    }
})(typeof window !== 'undefined' ? window : globalThis);
