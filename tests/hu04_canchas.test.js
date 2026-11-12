/** Pruebas de la HU04 - Configuración de Canchas y Tarifas Dinámicas */
const test = require('node:test');
const assert = require('node:assert');
const CanchaController = require('../src/controllers/CanchaController');

test('HU04 - calcula la tarifa base, de hora pico y de domingo/festivo', () => {
    const c = new CanchaController();
    assert.strictEqual(c.calcularTarifa(1, new Date(2026, 10, 10, 15)), 80000);   // martes 3 p. m.
    assert.strictEqual(c.calcularTarifa(1, new Date(2026, 10, 10, 19)), 110000);  // martes 7 p. m.
    assert.strictEqual(c.calcularTarifa(1, new Date(2026, 10, 15, 10)), 120000);  // domingo
    assert.strictEqual(c.calcularTarifa(1, new Date(2026, 10, 16, 10)), 120000);  // lunes festivo
});

test('HU04 - registra una cancha nueva y valida las tarifas', () => {
    const c = new CanchaController();
    const nueva = c.registrarCancha('Cancha 4', 'Fútbol 5', 85000, 115000, 125000);
    assert.strictEqual(nueva.id, 4);
    assert.throws(() => c.registrarCancha('Cancha 5', 'Fútbol 7', -1, 100, 100), /mayores que cero/);
    assert.throws(() => c.registrarCancha('Cancha 6', 'Fútbol 7', 100000, 90000, 120000), /no pueden ser menores/);
    assert.throws(() => c.registrarCancha('cancha 4', 'Fútbol 5', 1, 1, 1), /Ya existe/);
});

test('HU04 - una cancha inhabilitada no se puede vender', () => {
    const c = new CanchaController();
    c.cambiarEstado(3, false);
    assert.throws(() => c.calcularTarifa(3, new Date(2026, 10, 10, 19)), /inhabilitada/);
    assert.strictEqual(c.listarCanchasHabilitadas().length, 2);
});
