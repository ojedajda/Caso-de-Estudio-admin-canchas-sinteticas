/** Pruebas de la HU01 - Consulta de Disponibilidad de Canchas */
const test = require('node:test');
const assert = require('node:assert');
const { AHORA, nuevoSistema } = require('./ayuda');
const Reserva = require('../src/models/Reserva');

test('HU01 - muestra todas las franjas de 8:00 a 21:00 de cada cancha', () => {
    const s = nuevoSistema();
    const dia = s.disponibilidad.consultar('2026-11-13', {}, AHORA);
    assert.strictEqual(dia.length, 3);
    assert.strictEqual(dia[0].franjas.length, 14);
    assert.ok(dia[0].franjas.every((f) => f.estado === 'LIBRE'));
});

test('HU01 - marca como reservada una franja ocupada y como pasada una hora anterior', () => {
    const s = nuevoSistema();
    s.daos.reservaDAO.guardar(new Reserva({ id: 1, codigo: 'CG-0001', canchaId: 1, fecha: '2026-11-12', hora: 15 }));
    const [cancha1] = s.disponibilidad.consultar('2026-11-12', {}, AHORA);
    assert.strictEqual(cancha1.franjas.find((f) => f.hora === 15).estado, 'RESERVADA');
    assert.strictEqual(cancha1.franjas.find((f) => f.hora === 9).estado, 'PASADA');
    assert.throws(() => s.disponibilidad.validarFranja(1, '2026-11-12', 15, AHORA), /ya está reservada/);
});

test('HU01 - filtra por tipo de cancha y valida fecha y hora', () => {
    const s = nuevoSistema();
    assert.strictEqual(s.disponibilidad.consultar('2026-11-13', { tipo: 'Fútbol 7' }, AHORA).length, 1);
    assert.throws(() => s.disponibilidad.consultar('13/11/2026'), /AAAA-MM-DD/);
    assert.throws(() => s.disponibilidad.validarFranja(1, '2026-11-13', 23, AHORA), /La hora debe estar/);
});
