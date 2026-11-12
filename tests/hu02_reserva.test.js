/** Pruebas de la HU02 - Reserva de Cancha con Pago de Anticipo */
const test = require('node:test');
const assert = require('node:assert');
const { AHORA, nuevoSistema, reservar } = require('./ayuda');

test('HU02 - confirma la reserva cobrando el 50 % de anticipo', () => {
    const s = nuevoSistema();
    const r = reservar(s);
    assert.strictEqual(r.codigo, 'CG-0001');
    assert.strictEqual(r.estado, 'CONFIRMADA');
    assert.strictEqual(r.valorTotal, 80000);
    assert.strictEqual(r.pagado, 40000);
    assert.strictEqual(r.saldoPendiente, 40000);
    const [pago] = s.daos.pagoDAO.obtenerTodas();
    assert.deepStrictEqual([pago.tipo, pago.monto, pago.metodo], ['ANTICIPO', 40000, 'NEQUI']);
});

test('HU02 - control de concurrencia: no permite reservar dos veces la misma franja', () => {
    const s = nuevoSistema();
    reservar(s);
    assert.throws(() => reservar(s, { telefono: '3109876543' }), /ya está reservada/);
});

test('HU02 - valida datos del cliente y medio de pago', () => {
    const s = nuevoSistema();
    assert.throws(() => reservar(s, { telefono: '12345' }), /celular de 10 dígitos/);
    assert.throws(() => reservar(s, { nombre: 'Jo' }), /al menos 3 caracteres/);
    assert.throws(() => reservar(s, { metodoPago: 'EFECTIVO' }), /medio de pago/);
});
