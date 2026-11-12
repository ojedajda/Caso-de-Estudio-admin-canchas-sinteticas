/**
 * Pruebas de la HU03 - Cancelación y Reagendamiento de Turnos (Issue #3)
 * Criterio 1: cancelar o cambiar de fecha solo con 12 h o más de anticipación.
 * Criterio 2: al cancelar a tiempo se emite saldo a favor para una futura reserva.
 * Criterio 3: el horario cancelado queda libre de inmediato.
 */
const test = require('node:test');
const assert = require('node:assert');
const { AHORA, CLIENTE, nuevoSistema, reservar } = require('./ayuda');

/** Turno del viernes 13 de noviembre de 2026 a las 18:00 */
const TURNO = { fecha: '2026-11-13', hora: 18 };
/** Momentos relativos a ese turno */
const DOCE_HORAS_ANTES = new Date(2026, 10, 13, 6, 0);        // exactamente 12 h antes
const MAS_DE_DOCE_HORAS = new Date(2026, 10, 13, 5, 0);       // 13 h antes
const MENOS_DE_DOCE_HORAS = new Date(2026, 10, 13, 6, 30);    // 11,5 h antes

test('HU03 criterio 1 - cancelar: se permite con exactamente 12 h y con más de 12 h', () => {
    const s = nuevoSistema();
    const exacto = reservar(s, TURNO);
    assert.strictEqual(s.gestion.cancelar(exacto.codigo, 'SALDO_A_FAVOR', DOCE_HORAS_ANTES).reserva.estado, 'CANCELADA');
    const holgado = reservar(s, { ...TURNO, hora: 19 });
    assert.strictEqual(s.gestion.cancelar(holgado.codigo, 'SALDO_A_FAVOR', MAS_DE_DOCE_HORAS).reserva.estado, 'CANCELADA');
});

test('HU03 criterio 1 - cancelar: se rechaza con menos de 12 h y la reserva sigue confirmada', () => {
    const s = nuevoSistema();
    const r = reservar(s, TURNO);
    assert.throws(() => s.gestion.cancelar(r.codigo, 'SALDO_A_FAVOR', MENOS_DE_DOCE_HORAS), /Solo se puede cancelar con 12 h o más/);
    assert.strictEqual(r.estado, 'CONFIRMADA');
    assert.strictEqual(s.gestion.saldoAFavor(CLIENTE.telefono), 0);
});

test('HU03 criterio 1 - reagendar: se permite con exactamente 12 h y con más de 12 h, se rechaza con menos', () => {
    const s = nuevoSistema();
    const exacto = reservar(s, TURNO);
    s.gestion.reagendar(exacto.codigo, { fecha: '2026-11-14', hora: 10 }, DOCE_HORAS_ANTES);
    assert.deepStrictEqual([exacto.fecha, exacto.hora], ['2026-11-14', 10]);
    const holgado = reservar(s, { ...TURNO, hora: 19 });
    s.gestion.reagendar(holgado.codigo, { fecha: '2026-11-14', hora: 11 }, MAS_DE_DOCE_HORAS);
    assert.deepStrictEqual([holgado.fecha, holgado.hora], ['2026-11-14', 11]);
    const tarde = reservar(s, TURNO);                                          // 18:00 quedó libre al mover la primera
    assert.throws(() => s.gestion.reagendar(tarde.codigo, { fecha: '2026-11-14', hora: 12 }, MENOS_DE_DOCE_HORAS), /Solo se puede reagendar con 12 h o más/);
    assert.deepStrictEqual([tarde.fecha, tarde.hora], ['2026-11-13', 18]);
});

test('HU03 criterio 1 - la política informa qué está permitido en cada momento', () => {
    const s = nuevoSistema();
    const r = reservar(s, TURNO);
    assert.strictEqual(s.gestion.politica(r, DOCE_HORAS_ANTES).puedeCancelar, true);
    assert.strictEqual(s.gestion.politica(r, MENOS_DE_DOCE_HORAS).puedeCancelar, false);
    assert.strictEqual(s.gestion.politica(r, MENOS_DE_DOCE_HORAS).puedeReagendar, false);
});

test('HU03 criterio 2 - el saldo a favor se genera, queda asociado al cliente y se usa en una reserva posterior', () => {
    const s = nuevoSistema();
    const r = reservar(s, TURNO);                                                 // anticipo $55.000 (hora pico)
    const resultado = s.gestion.cancelar(r.codigo, undefined, MAS_DE_DOCE_HORAS);  // destino por defecto
    assert.deepStrictEqual([resultado.destino, resultado.alSaldo, resultado.reembolsado], ['SALDO_A_FAVOR', 55000, 0]);
    const cliente = s.daos.clienteDAO.buscarPorTelefono(CLIENTE.telefono);
    assert.strictEqual(cliente.saldoAFavor, 55000);
    assert.strictEqual(s.reportes.recaudoDiario('2026-11-13', MAS_DE_DOCE_HORAS).reembolsos, 0);
    // Reserva posterior de $80.000: anticipo $40.000 cubierto con el saldo a favor
    const nueva = reservar(s, { fecha: '2026-11-14', hora: 10 }, MAS_DE_DOCE_HORAS);
    assert.strictEqual(nueva.pagado, 40000);
    assert.strictEqual(cliente.saldoAFavor, 15000);
    const pagos = s.daos.pagoDAO.buscarPorReserva(nueva.id);
    assert.deepStrictEqual(pagos.map((p) => [p.tipo, p.monto]), [['SALDO_A_FAVOR', 40000]]);
});

test('HU03 criterio 3 - el horario cancelado queda libre de inmediato y otro cliente puede reservarlo', () => {
    const s = nuevoSistema();
    const r = reservar(s, TURNO);
    assert.strictEqual(s.disponibilidad.horasLibres(1, TURNO.fecha, MAS_DE_DOCE_HORAS).includes(18), false);
    s.gestion.cancelar(r.codigo, 'SALDO_A_FAVOR', MAS_DE_DOCE_HORAS);
    assert.strictEqual(s.disponibilidad.horasLibres(1, TURNO.fecha, MAS_DE_DOCE_HORAS).includes(18), true);
    const otro = reservar(s, { ...TURNO, nombre: 'Samuel Betancourt', telefono: '3109876543' }, MAS_DE_DOCE_HORAS);
    assert.strictEqual(otro.estado, 'CONFIRMADA');
});

test('HU03 - reembolso opcional: solo se devuelve en dinero lo pagado en dinero', () => {
    const s = nuevoSistema();
    const primera = reservar(s, { fecha: '2026-11-14', hora: 10 });               // paga $40.000 en Nequi
    s.gestion.cancelar(primera.codigo, 'SALDO_A_FAVOR', AHORA);                     // saldo a favor $40.000
    const segunda = reservar(s, { fecha: '2026-11-14', hora: 19 });                // anticipo $55.000: $40.000 saldo + $15.000 Nequi
    const resultado = s.gestion.cancelar(segunda.codigo, 'REEMBOLSO', AHORA);
    assert.deepStrictEqual([resultado.alSaldo, resultado.reembolsado], [40000, 15000]);
    assert.strictEqual(s.gestion.saldoAFavor(CLIENTE.telefono), 40000);
    assert.strictEqual(s.reportes.recaudoDiario('2026-11-12', AHORA).reembolsos, -15000);
});

test('HU03 - reagendar mueve la reserva a una franja libre y recalcula la tarifa', () => {
    const s = nuevoSistema();
    const r = reservar(s, { fecha: '2026-11-14', hora: 10 });                     // $80.000
    s.gestion.reagendar(r.codigo, { fecha: '2026-11-14', hora: 19 }, AHORA);       // hora pico $110.000
    assert.deepStrictEqual([r.hora, r.valorTotal, r.saldoPendiente], [19, 110000, 70000]);
    assert.strictEqual(s.disponibilidad.horasLibres(1, '2026-11-14', AHORA).includes(10), true);
});
