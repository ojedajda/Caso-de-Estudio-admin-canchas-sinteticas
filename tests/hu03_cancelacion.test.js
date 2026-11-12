/** Pruebas de la HU03 - Cancelación y Reagendamiento de Turnos */
const test = require('node:test');
const assert = require('node:assert');
const { AHORA, nuevoSistema, reservar } = require('./ayuda');

test('HU03 - cancelar con 24 h o más devuelve lo pagado como saldo a favor', () => {
    const s = nuevoSistema();
    const r = reservar(s, { fecha: '2026-11-14' });
    const { devuelto } = s.gestion.cancelar(r.codigo, 'SALDO_A_FAVOR', AHORA);
    assert.strictEqual(devuelto, 40000);
    assert.strictEqual(r.estado, 'CANCELADA');
    assert.strictEqual(s.gestion.saldoAFavor('3001234567'), 40000);
    const nueva = reservar(s, { fecha: '2026-11-14', hora: 9 });                  // usa el saldo a favor
    assert.strictEqual(nueva.pagado, 40000);
    assert.strictEqual(s.gestion.saldoAFavor('3001234567'), 0);
});

test('HU03 - cancelar con menos de 24 h no devuelve el anticipo; el reembolso resta en caja', () => {
    const s = nuevoSistema();
    const tarde = reservar(s, { fecha: '2026-11-12', hora: 20 });
    assert.strictEqual(s.gestion.cancelar(tarde.codigo, 'SALDO_A_FAVOR', AHORA).devuelto, 0);
    const temprano = reservar(s, { fecha: '2026-11-20', hora: 10 });
    s.gestion.cancelar(temprano.codigo, 'REEMBOLSO', AHORA);
    assert.strictEqual(s.reportes.recaudoDiario('2026-11-12', AHORA).reembolsos, -40000);
});

test('HU03 - reagendar mueve la reserva a una franja libre y recalcula la tarifa', () => {
    const s = nuevoSistema();
    const r = reservar(s, { fecha: '2026-11-14', hora: 10 });                     // $80.000
    s.gestion.reagendar(r.codigo, { fecha: '2026-11-14', hora: 19 }, AHORA);       // hora pico $110.000
    assert.deepStrictEqual([r.hora, r.valorTotal, r.saldoPendiente], [19, 110000, 70000]);
    assert.strictEqual(s.disponibilidad.horasLibres(1, '2026-11-14', AHORA).includes(10), true);
    const otra = reservar(s, { fecha: '2026-11-12', hora: 20 });
    assert.throws(() => s.gestion.reagendar(otra.codigo, { fecha: '2026-11-14', hora: 11 }, AHORA), /24 h o más/);
});
