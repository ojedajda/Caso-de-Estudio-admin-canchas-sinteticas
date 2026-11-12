/**
 * Modelo de datos que representa la entidad Cancha (HU04)
 * Aplica el principio de responsabilidad única (SOLID - SRP):
 * solo describe la estructura de la cancha y sus tarifas.
 */
class Cancha {
    /**
     * @param {number} id Identificador único de la cancha
     * @param {string} nombre Nombre visible, ej: "Cancha 1"
     * @param {string} tipo Modalidad de juego, ej: "Fútbol 5", "Fútbol 7", "Fútbol 8"
     * @param {number} tarifaBase Valor por hora en horario normal (COP)
     * @param {number} tarifaHoraPico Valor por hora en franja pico (COP)
     * @param {number} tarifaFestivo Valor por hora en domingos y festivos (COP)
     * @param {boolean} [habilitada=true] Indica si la cancha está disponible para la venta
     */
    constructor(id, nombre, tipo, tarifaBase, tarifaHoraPico, tarifaFestivo, habilitada = true) {
        this.id = id;
        this.nombre = nombre;
        this.tipo = tipo;
        this.tarifaBase = tarifaBase;
        this.tarifaHoraPico = tarifaHoraPico;
        this.tarifaFestivo = tarifaFestivo;
        this.habilitada = habilitada;
    }
}

module.exports = Cancha;
