/** Pruebas de la HU12 - Bloqueo de Emergencia por Mantenimiento o Imprevistos */
const test = require('node:test');
const assert = require('node:assert');
const { AHORA, nuevoSistema, reservar } = require('./ayuda');

test('HU12 - bloquea la franja, cancela las reservas afectadas y devuelve el saldo', () => {
    const s = nuevoSistema();
    const r = reservar(s, { fecha: '2026-11-13', hora: 15 });
    const { afectadas } = s.bloqueos.bloquear({ canchaId: 1, fecha: '2026-11-13', horaInicio: 14, horaFin: 17, motivo: 'Lluvia fuerte' }, AHORA);
    assert.strictEqual(afectadas.length, 1);
    assert.strictEqual(r.estado, 'CANCELADA_BLOQUEO');
    assert.strictEqual(s.gestion.saldoAFavor('3001234567'), 40000);
    assert.strictEqual(s.notificaciones.listar()[0].tipo, 'BLOQUEO');
    const [cancha1] = s.disponibilidad.consultar('2026-11-13', {}, AHORA);
    assert.strictEqual(cancha1.franjas.find((f) => f.hora === 16).estado, 'BLOQUEADA');
    assert.throws(() => reservar(s, { fecha: '2026-11-13', hora: 16 }), /bloqueada/);
});

test('HU12 - valida datos, evita bloqueos cruzados y permite levantarlos', () => {
    const s = nuevoSistema();
    const { bloqueo } = s.bloqueos.bloquear({ canchaId: 2, fecha: '2026-11-13', horaInicio: 8, horaFin: 10, motivo: 'Mantenimiento' }, AHORA);
    assert.throws(() => s.bloqueos.bloquear({ canchaId: 2, fecha: '2026-11-13', horaInicio: 9, horaFin: 11, motivo: 'Otro' }, AHORA), /ya tiene un bloqueo/);
    assert.throws(() => s.bloqueos.bloquear({ canchaId: 2, fecha: '2026-11-13', horaInicio: 12, horaFin: 11, motivo: 'Riego' }, AHORA), /rango de horas/);
    s.bloqueos.levantar(bloqueo.id);
    assert.strictEqual(s.disponibilidad.horasLibres(2, '2026-11-13', AHORA).includes(8), true);
});
