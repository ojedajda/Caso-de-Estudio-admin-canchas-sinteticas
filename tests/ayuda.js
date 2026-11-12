/**
 * Utilidades compartidas por las pruebas automatizadas (node --test).
 * Todas las pruebas usan un "ahora" fijo para que los resultados no dependan del día en que se ejecutan.
 */
const { crearSistema } = require('../src/Sistema');

/** Jueves 12 de noviembre de 2026, 10:00 a. m. */
const AHORA = new Date(2026, 10, 12, 10, 0);

/** Datos de un cliente válido */
const CLIENTE = { nombre: 'Jesús Ojeda', telefono: '3001234567' };

/**
 * Crea un sistema nuevo en memoria
 * @returns {Object}
 */
function nuevoSistema() {
    return crearSistema(null);
}

/**
 * Crea una reserva web confirmada
 * @param {Object} sistema
 * @param {Object} [datos] Campos a sobrescribir
 * @param {Date} [ahora=AHORA]
 */
function reservar(sistema, datos = {}, ahora = AHORA) {
    return sistema.reservas.crearReserva({
        canchaId: 1, fecha: '2026-11-13', hora: 15, metodoPago: 'NEQUI', ...CLIENTE, ...datos
    }, ahora);
}

module.exports = { AHORA, CLIENTE, nuevoSistema, reservar };
