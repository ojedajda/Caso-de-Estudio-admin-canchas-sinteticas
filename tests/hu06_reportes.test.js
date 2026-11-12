/** Pruebas de la HU06 - Reporte y Monitoreo de Recaudos Diarios */
const test = require('node:test');
const assert = require('node:assert');
const { AHORA, CLIENTE, nuevoSistema, reservar } = require('./ayuda');

test('HU06 - consolida anticipos, saldos y pagos por medio de pago', () => {
    const s = nuevoSistema();
    const r = reservar(s, { fecha: '2026-11-12', hora: 15 });                     // anticipo 40.000 NEQUI
    s.taquilla.registrar({ canchaId: 2, fecha: '2026-11-12', hora: 16, ...CLIENTE, canal: 'PRESENCIAL', metodoPago: 'EFECTIVO', pagarTotal: true }, AHORA); // 120.000
    s.acceso.registrarIngreso(r.codigo, 'EFECTIVO', AHORA);                        // saldo 40.000
    const rep = s.reportes.recaudoDiario('2026-11-12', AHORA);
    assert.strictEqual(rep.anticipos, 40000);
    assert.strictEqual(rep.saldos, 40000);
    assert.strictEqual(rep.pagosTotales, 120000);
    assert.strictEqual(rep.totalNeto, 200000);
    assert.deepStrictEqual(rep.porMetodo, { NEQUI: 40000, EFECTIVO: 160000 });
    assert.strictEqual(rep.indicadores.ingresadas, 1);
});

test('HU06 - exporta el reporte en CSV', () => {
    const s = nuevoSistema();
    reservar(s, { fecha: '2026-11-12', hora: 15 });
    const csv = s.reportes.exportarCSV('2026-11-12');
    assert.match(csv, /^Fecha;Hora;Reserva;Tipo/);
    assert.match(csv, /CG-0001;ANTICIPO;NEQUI/);
    assert.match(csv, /TOTAL NETO;40000/);
});
