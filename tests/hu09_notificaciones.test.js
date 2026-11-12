/** Pruebas de la HU09 - Notificaciones Automáticas de Confirmación y Recordatorio */
const test = require('node:test');
const assert = require('node:assert');
const { AHORA, nuevoSistema, reservar } = require('./ayuda');

test('HU09 - envía la confirmación por WhatsApp al reservar', () => {
    const s = nuevoSistema();
    const r = reservar(s);
    const [n] = s.notificaciones.listar('3001234567');
    assert.strictEqual(n.tipo, 'CONFIRMACION');
    assert.strictEqual(n.canal, 'WHATSAPP');
    assert.match(n.mensaje, new RegExp(r.codigo));
});

test('HU09 - genera recordatorios solo para turnos de las próximas 24 h y una sola vez', () => {
    const s = nuevoSistema();
    reservar(s, { fecha: '2026-11-13', hora: 9 });     // dentro de 23 h
    reservar(s, { fecha: '2026-11-20', hora: 9 });     // dentro de 8 días
    assert.strictEqual(s.notificaciones.generarRecordatorios(AHORA).length, 1);
    assert.strictEqual(s.notificaciones.generarRecordatorios(AHORA).length, 0);
});
