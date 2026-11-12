/**
 * Capa de Presentación / Vista para la configuración de canchas (HU04)
 * Solo se encarga de mostrar información; no contiene reglas de negocio
 * y se comunica con el sistema únicamente a través de la fachada (CanchaController).
 */
class CanchaView {
    /**
     * Contrato: Muestra en consola una tabla con las canchas y sus tarifas
     * @param {Array<import('../models/Cancha')>} canchas
     */
    mostrarCanchas(canchas) {
        console.table(canchas.map((c) => ({
            ID: c.id,
            Nombre: c.nombre,
            Tipo: c.tipo,
            'Tarifa base': this.formatearCOP(c.tarifaBase),
            'Hora pico': this.formatearCOP(c.tarifaHoraPico),
            Festivo: this.formatearCOP(c.tarifaFestivo),
            Estado: c.habilitada ? 'Habilitada' : 'Inhabilitada'
        })));
    }

    /**
     * Contrato: Muestra un mensaje informativo
     * @param {string} mensaje
     */
    mostrarMensaje(mensaje) {
        console.log(`✔ ${mensaje}`);
    }

    /**
     * Contrato: Muestra un mensaje de error de validación
     * @param {string} mensaje
     */
    mostrarError(mensaje) {
        console.log(`✖ Error: ${mensaje}`);
    }

    /**
     * Contrato: Da formato de pesos colombianos a un valor numérico
     * @param {number} valor
     * @returns {string} Valor formateado, ej: "$ 80.000"
     */
    formatearCOP(valor) {
        return `$ ${valor.toLocaleString('es-CO')}`;
    }
}

module.exports = CanchaView;
