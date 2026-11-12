/** Pruebas de la HU07 - Registro de Ingreso y Cobro de Saldo Restante */
const test = require('node:test');
const assert = require('node:assert');
const { AHORA, nuevoSistema, reservar } = require('./ayuda');

test('HU07 - cobra el saldo y registra el ingreso el día del turno', () => {
    const s = nuevoSistema();
    const r = reservar(s, { fecha: '2026-11-12', hora: 18 });   // hora pico: $110.000
    const { cobrado } = s.acceso.registrarIngreso(r.codigo, 'EFECTIVO', new Date(2026, 10, 12, 17, 50));
    assert.strictEqual(cobrado, 55000);
    assert.strictEqual(r.estado, 'INGRESADA');
    assert.strictEqual(r.saldoPendiente, 0);
    assert.throws(() => s.acceso.registrarIngreso(r.codigo, 'EFECTIVO', AHORA), /ya registró ingreso/);
});

test('HU07 - no permite ingreso en un día distinto al del turno y busca por teléfono', () => {
    const s = nuevoSistema();
    const r = reservar(s);
    assert.throws(() => s.acceso.registrarIngreso(r.codigo, 'EFECTIVO', AHORA), /solo se registra el día del turno/);
    assert.strictEqual(s.acceso.buscar('3001234567').length, 1);
    assert.strictEqual(s.acceso.buscar('cg-0001')[0].codigo, 'CG-0001');
});
