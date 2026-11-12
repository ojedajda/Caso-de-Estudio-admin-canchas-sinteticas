/** Pruebas de la HU08 - Registro Manual de Reservas Presenciales o Telefónicas */
const test = require('node:test');
const assert = require('node:assert');
const { AHORA, CLIENTE, nuevoSistema, reservar } = require('./ayuda');

test('HU08 - registra una reserva presencial pagada completa y genera el recibo', () => {
    const s = nuevoSistema();
    const { reserva, recibo } = s.taquilla.registrar({
        canchaId: 2, fecha: '2026-11-13', hora: 10, ...CLIENTE, canal: 'PRESENCIAL', metodoPago: 'EFECTIVO', pagarTotal: true
    }, AHORA);
    assert.strictEqual(reserva.canal, 'PRESENCIAL');
    assert.strictEqual(recibo.numero, 'REC-CG-0001');
    assert.strictEqual(recibo.saldoPendiente, 0);
    assert.strictEqual(recibo.pagos[0].tipo, 'TOTAL');
});

test('HU08 - la reserva telefónica bloquea la agenda web de inmediato', () => {
    const s = nuevoSistema();
    s.taquilla.registrar({ canchaId: 1, fecha: '2026-11-13', hora: 15, ...CLIENTE, canal: 'TELEFONICA', metodoPago: 'TRANSFERENCIA' }, AHORA);
    assert.throws(() => reservar(s, { telefono: '3115550000' }), /ya está reservada/);
    assert.throws(() => s.taquilla.registrar({ canchaId: 1, fecha: '2026-11-13', hora: 16, ...CLIENTE, canal: 'WEB', metodoPago: 'EFECTIVO' }, AHORA), /PRESENCIAL o TELEFONICA/);
});
