const Cancha = require('../models/Cancha');

/**
 * Clase DAO para gestionar la persistencia y consulta de Canchas (HU04)
 * Simula la integración con Base de Datos: la lógica de negocio
 * consume los datos sin saber cómo ni dónde están almacenados.
 */
class CanchaDAO {
    constructor() {
        // Persistencia simulada en memoria para el prototipo
        this.canchasBD = [
            new Cancha(1, 'Cancha 1', 'Fútbol 5', 80000, 110000, 120000),
            new Cancha(2, 'Cancha 2', 'Fútbol 7', 120000, 160000, 170000),
            new Cancha(3, 'Cancha 3', 'Fútbol 8', 150000, 200000, 210000)
        ];
    }

    /**
     * Contrato de método: Retorna la lista completa de canchas
     * @returns {Array<Cancha>} Lista de entidades
     */
    obtenerTodas() {
        return this.canchasBD;
    }

    /**
     * Contrato de método: Busca una cancha por su identificador
     * @param {number} id Identificador de la cancha
     * @returns {Cancha|undefined} La cancha encontrada o undefined si no existe
     */
    buscarPorId(id) {
        return this.canchasBD.find((cancha) => cancha.id === id);
    }

    /**
     * Contrato de método: Inserta una nueva cancha en la base de datos
     * @param {Cancha} nuevaCancha
     * @returns {Cancha} Objeto guardado
     */
    guardar(nuevaCancha) {
        this.canchasBD.push(nuevaCancha);
        return nuevaCancha;
    }

    /**
     * Contrato de método: Actualiza los campos de una cancha existente
     * @param {number} id Identificador de la cancha
     * @param {Object} cambios Campos a modificar (ej: { tarifaBase: 90000 })
     * @returns {Cancha|undefined} La cancha actualizada o undefined si no existe
     */
    actualizar(id, cambios) {
        const cancha = this.buscarPorId(id);
        if (!cancha) {
            return undefined;
        }
        Object.assign(cancha, cambios);
        return cancha;
    }
}

module.exports = CanchaDAO;
