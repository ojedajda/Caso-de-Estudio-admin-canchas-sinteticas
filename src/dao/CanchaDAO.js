/**
 * Clase DAO para gestionar la persistencia y consulta de Canchas (HU04)
 * Simula la integración con Base de Datos: la lógica de negocio
 * consume los datos sin saber cómo ni dónde están almacenados.
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Cancha = importar('../models/Cancha', 'Cancha');
    const RepositorioBase = importar('./RepositorioBase', 'RepositorioBase');

    /** Canchas con las que inicia el sistema (semilla de la BD) */
    const SEMILLA = [
        { id: 1, nombre: 'Cancha 1', tipo: 'Fútbol 5', tarifaBase: 80000, tarifaHoraPico: 110000, tarifaFestivo: 120000 },
        { id: 2, nombre: 'Cancha 2', tipo: 'Fútbol 7', tarifaBase: 120000, tarifaHoraPico: 160000, tarifaFestivo: 170000 },
        { id: 3, nombre: 'Cancha 3', tipo: 'Fútbol 8', tarifaBase: 150000, tarifaHoraPico: 200000, tarifaFestivo: 210000 }
    ];

    class CanchaDAO extends RepositorioBase {
        /**
         * @param {Object|null} [almacen=null] Almacén de datos (null = persistencia simulada en memoria)
         */
        constructor(almacen = null) {
            super(almacen, 'canchas', Cancha, SEMILLA);
        }

        // Hereda de RepositorioBase los contratos:
        // obtenerTodas(), buscarPorId(id), guardar(cancha), actualizar(id, cambios), siguienteId()

        /**
         * Contrato de método: Retorna solo las canchas habilitadas para la venta
         * @returns {Array<Cancha>}
         */
        obtenerHabilitadas() {
            return this.filtrar((cancha) => cancha.habilitada);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CanchaDAO;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).CanchaDAO = CanchaDAO;
    }
})(typeof window !== 'undefined' ? window : globalThis);
