/** Pruebas de la HU05 - Creación de Promociones y Descuentos */
const test = require('node:test');
const assert = require('node:assert');
const { AHORA, nuevoSistema, reservar } = require('./ayuda');

const CUPON = { codigo: 'manana20', descripcion: 'Mañanas', tipo: 'PORCENTAJE', valor: 20, fechaInicio: '2026-11-01', fechaFin: '2026-11-30', soloHorarioValle: true };

test('HU05 - aplica el descuento del cupón y cuenta sus usos', () => {
    const s = nuevoSistema();
    s.promociones.crear(CUPON);
    const r = reservar(s, { codigoPromocion: 'MANANA20' });                       // $80.000 - 20 %
    assert.deepStrictEqual([r.descuento, r.valorTotal, r.pagado], [16000, 64000, 32000]);
    assert.strictEqual(s.promociones.listar()[0].usos, 1);
});

test('HU05 - rechaza cupones fuera de horario valle, vencidos, inactivos o inválidos', () => {
    const s = nuevoSistema();
    const promo = s.promociones.crear(CUPON);
    s.promociones.crear({ codigo: 'FIJO10K', tipo: 'MONTO', valor: 10000, fechaInicio: '2026-12-01', fechaFin: '2026-12-31' });
    assert.throws(() => reservar(s, { hora: 19, codigoPromocion: 'MANANA20' }), /horario valle/);
    assert.throws(() => reservar(s, { codigoPromocion: 'FIJO10K' }), /es válido del/);
    s.promociones.cambiarEstado(promo.id, false);
    assert.throws(() => reservar(s, { codigoPromocion: 'MANANA20' }), /desactivado/);
    assert.throws(() => s.promociones.crear({ ...CUPON, codigo: 'XX' }), /4 a 15/);
    assert.throws(() => s.promociones.crear({ ...CUPON, codigo: 'OTRO', valor: 95 }), /entre 1 y 90/);
});
