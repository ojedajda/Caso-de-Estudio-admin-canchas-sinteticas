/**
 * Controlador (Facade) de Calificación y Reseña del Servicio de la Cancha (HU11)
 * Solo califica quien jugó (reserva con ingreso registrado) y una sola vez por reserva.
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Fechas = importar('../utils/Fechas', 'Fechas');
    const Reserva = importar('../models/Reserva', 'Reserva');
    const Resena = importar('../models/Resena', 'Resena');

    const MAX_COMENTARIO = 300;

    class ResenaController {
        /**
         * @param {Object} deps Dependencias: resenaDAO, reservaDAO, canchaDAO y reservas
         */
        constructor(deps) {
            this.deps = deps;
        }

        /**
         * Contrato: Reservas jugadas de un cliente que aún no tienen reseña
         * @param {string} telefono
         * @returns {Array<Reserva>}
         */
        pendientesPorCalificar(telefono) {
            return this.deps.reservaDAO.buscarPorTelefono(telefono)
                .filter((r) => r.estado === Reserva.ESTADOS.INGRESADA && !this.deps.resenaDAO.buscarPorReserva(r.id));
        }

        /**
         * Contrato: Registra la calificación de un servicio
         * @param {string} codigo Código de la reserva jugada
         * @param {number} calificacion Entero de 1 a 5
         * @param {string} [comentario='']
         * @param {Date} [ahora=new Date()]
         * @returns {Resena}
         * @throws {Error} Si la reserva no se jugó, ya fue calificada o los datos no son válidos
         */
        calificar(codigo, calificacion, comentario = '', ahora = new Date()) {
            const reserva = this.deps.reservas.obtenerPorCodigo(codigo);
            const estrellas = Number(calificacion);
            const texto = String(comentario || '').trim();
            if (reserva.estado !== Reserva.ESTADOS.INGRESADA) {
                throw new Error('Solo se pueden calificar reservas en las que el equipo registró ingreso');
            }
            if (this.deps.resenaDAO.buscarPorReserva(reserva.id)) {
                throw new Error(`La reserva ${reserva.codigo} ya fue calificada`);
            }
            if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
                throw new Error('La calificación debe ser de 1 a 5 estrellas');
            }
            if (texto.length > MAX_COMENTARIO) {
                throw new Error(`El comentario admite máximo ${MAX_COMENTARIO} caracteres`);
            }
            return this.deps.resenaDAO.guardar(new Resena({
                id: this.deps.resenaDAO.siguienteId(),
                reservaId: reserva.id,
                canchaId: reserva.canchaId,
                cliente: reserva.clienteNombre,
                calificacion: estrellas,
                comentario: texto,
                fecha: Fechas.hoy(ahora)
            }));
        }

        /**
         * Contrato: Promedio de calificación por cancha
         * @returns {Array<{canchaId: number, cancha: string, promedio: number, total: number}>}
         */
        promedios() {
            return this.deps.canchaDAO.obtenerTodas().map((cancha) => {
                const resenas = this.deps.resenaDAO.buscarPorCancha(cancha.id);
                const suma = resenas.reduce((total, r) => total + r.calificacion, 0);
                return {
                    canchaId: cancha.id,
                    cancha: cancha.nombre,
                    promedio: resenas.length ? Math.round((suma / resenas.length) * 10) / 10 : 0,
                    total: resenas.length
                };
            });
        }

        /**
         * Contrato: Reseñas más recientes
         * @param {number} [limite=10]
         * @returns {Array<Resena>}
         */
        recientes(limite = 10) {
            return this.deps.resenaDAO.obtenerTodas().slice().sort((a, b) => b.id - a.id).slice(0, limite);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ResenaController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).ResenaController = ResenaController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
