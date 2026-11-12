/** Pruebas de la HU11 - Calificación y Reseña del Servicio de la Cancha */
const test = require('node:test');
const assert = require('node:assert');
const { AHORA, nuevoSistema, reservar } = require('./ayuda');

test('HU11 - solo califica quien jugó y una sola vez por reserva', () => {
    const s = nuevoSistema();
    const r = reservar(s, { fecha: '2026-11-12', hora: 15 });
    assert.throws(() => s.resenas.calificar(r.codigo, 5, 'Excelente', AHORA), /registró ingreso/);
    s.acceso.registrarIngreso(r.codigo, 'EFECTIVO', AHORA);
    assert.strictEqual(s.resenas.pendientesPorCalificar('3001234567').length, 1);
    s.resenas.calificar(r.codigo, 4, 'Buena grama', AHORA);
    assert.throws(() => s.resenas.calificar(r.codigo, 5, '', AHORA), /ya fue calificada/);
    assert.deepStrictEqual(s.resenas.promedios()[0], { canchaId: 1, cancha: 'Cancha 1', promedio: 4, total: 1 });
});

test('HU11 - valida el rango de estrellas', () => {
    const s = nuevoSistema();
    const r = reservar(s, { fecha: '2026-11-12', hora: 15 });
    s.acceso.registrarIngreso(r.codigo, 'EFECTIVO', AHORA);
    assert.throws(() => s.resenas.calificar(r.codigo, 6, '', AHORA), /1 a 5/);
});
