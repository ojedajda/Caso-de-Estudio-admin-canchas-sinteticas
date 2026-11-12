/** Pruebas de la HU10 - Historial de Reservas y Repetición de Turno Frecuente */
const test = require('node:test');
const assert = require('node:assert');
const { AHORA, nuevoSistema, reservar } = require('./ayuda');

test('HU10 - muestra el historial y el turno frecuente del cliente', () => {
    const s = nuevoSistema();
    reservar(s, { fecha: '2026-11-13', hora: 19 });
    reservar(s, { fecha: '2026-11-20', hora: 19 });
    const { reservas, resumen } = s.historial.historial('3001234567');
    assert.strictEqual(reservas.length, 2);
    assert.strictEqual(reservas[0].fecha, '2026-11-20');
    assert.deepStrictEqual([resumen.turnoFrecuente.dia, resumen.turnoFrecuente.hora, resumen.turnoFrecuente.veces], ['viernes', 19, 2]);
});

test('HU10 - repite el turno la siguiente semana con cupo libre', () => {
    const s = nuevoSistema();
    const base = reservar(s, { fecha: '2026-11-13', hora: 19 });
    reservar(s, { fecha: '2026-11-20', hora: 19, telefono: '3157778888' });       // otra persona ocupa el 20
    const nueva = s.historial.repetirTurno(base.codigo, 'PSE', AHORA);
    assert.strictEqual(nueva.fecha, '2026-11-27');
    assert.strictEqual(nueva.hora, 19);
});
