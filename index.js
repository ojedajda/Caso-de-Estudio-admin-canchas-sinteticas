/**
 * Punto de entrada del prototipo CanchaGO – HU04 Configuración de Canchas y Tarifas Dinámicas.
 * Ejecutar con: node index.js
 */
const CanchaController = require('./src/controllers/CanchaController');
const CanchaView = require('./src/views/CanchaView');

const controlador = new CanchaController();
const vista = new CanchaView();

// 1. Canchas configuradas inicialmente
vista.mostrarMensaje('Canchas configuradas:');
vista.mostrarCanchas(controlador.listarCanchas());

// 2. El administrador registra una nueva cancha con sus tarifas
const nueva = controlador.crearCancha(4, 'Cancha 4', 'Fútbol 5', 85000, 115000, 125000);
vista.mostrarMensaje(`Se registró ${nueva.nombre}`);

// 3. Ajuste de tarifas dinámicas
controlador.actualizarTarifas(1, 90000, 120000, 130000);
vista.mostrarMensaje('Tarifas de la Cancha 1 actualizadas');

// 4. Inhabilitar una cancha para la venta
controlador.cambiarEstado(3, false);
vista.mostrarMensaje('Cancha 3 inhabilitada para la venta');
vista.mostrarCanchas(controlador.listarCanchas());

// 5. Cálculo de la tarifa según la franja horaria
const martesTarde = new Date(2026, 10, 10, 15, 0);   // martes 3:00 p. m. -> tarifa base
const martesNoche = new Date(2026, 10, 10, 19, 0);   // martes 7:00 p. m. -> hora pico
const domingo = new Date(2026, 10, 15, 10, 0);       // domingo -> festivo
vista.mostrarMensaje(`Cancha 1, martes 3 p. m.: ${vista.formatearCOP(controlador.calcularTarifa(1, martesTarde))}`);
vista.mostrarMensaje(`Cancha 1, martes 7 p. m.: ${vista.formatearCOP(controlador.calcularTarifa(1, martesNoche))}`);
vista.mostrarMensaje(`Cancha 1, domingo: ${vista.formatearCOP(controlador.calcularTarifa(1, domingo))}`);

// 6. Validaciones de reglas de negocio
try {
    controlador.crearCancha(5, 'Cancha 5', 'Fútbol 7', -1000, 100000, 100000);
} catch (error) {
    vista.mostrarError(error.message);
}
try {
    controlador.calcularTarifa(3, martesNoche);
} catch (error) {
    vista.mostrarError(error.message);
}
