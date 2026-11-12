/**
 * Controlador que actúa como fachada (Facade) para la configuración
 * de canchas y tarifas dinámicas (HU04).
 * Centraliza las reglas de negocio; la vista solo llama a estos métodos.
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const CanchaDAO = importar('../dao/CanchaDAO', 'CanchaDAO');
    const Cancha = importar('../models/Cancha', 'Cancha');
    const Fechas = importar('../utils/Fechas', 'Fechas');

    /** Franja horaria considerada "hora pico" (formato 24 h): desde las 18:00 hasta antes de las 22:00 */
    const HORA_PICO_INICIO = 18;
    const HORA_PICO_FIN = 22;
    const TIPOS = ['Fútbol 5', 'Fútbol 7', 'Fútbol 8'];

    class CanchaController {
        /**
         * @param {CanchaDAO} [canchaDAO] DAO inyectado (inversión de dependencias); por defecto uno en memoria
         */
        constructor(canchaDAO = new CanchaDAO()) {
            this.canchaDAO = canchaDAO;
        }

        /**
         * Contrato: Retorna la lista de canchas configuradas
         * @returns {Array<Cancha>}
         */
        listarCanchas() {
            return this.canchaDAO.obtenerTodas();
        }

        /**
         * Contrato: Retorna solo las canchas habilitadas para la venta
         * @returns {Array<Cancha>}
         */
        listarCanchasHabilitadas() {
            return this.canchaDAO.obtenerTodas().filter((cancha) => cancha.habilitada);
        }

        /**
         * Contrato: Busca una cancha por su identificador
         * @param {number} id
         * @returns {Cancha}
         * @throws {Error} Si la cancha no existe
         */
        obtenerCancha(id) {
            const cancha = this.canchaDAO.buscarPorId(id);
            if (!cancha) {
                throw new Error(`No existe una cancha con id ${id}`);
            }
            return cancha;
        }

        /**
         * Contrato: Parametriza y registra una nueva cancha con sus tarifas
         * @param {number} id
         * @param {string} nombre
         * @param {string} tipo
         * @param {number} tarifaBase Valor por hora normal (COP)
         * @param {number} tarifaHoraPico Valor por hora pico (COP)
         * @param {number} tarifaFestivo Valor por hora en festivo (COP)
         * @returns {Cancha} Cancha registrada
         * @throws {Error} Si el id ya existe o las tarifas no son válidas
         */
        crearCancha(id, nombre, tipo, tarifaBase, tarifaHoraPico, tarifaFestivo) {
            if (this.canchaDAO.buscarPorId(id)) {
                throw new Error(`Ya existe una cancha con id ${id}`);
            }
            if (!nombre || !tipo) {
                throw new Error('El nombre y el tipo de la cancha son obligatorios');
            }
            this.validarTarifas(tarifaBase, tarifaHoraPico, tarifaFestivo);
            const cancha = new Cancha(id, nombre, tipo, tarifaBase, tarifaHoraPico, tarifaFestivo);
            return this.canchaDAO.guardar(cancha);
        }

        /**
         * Contrato: Registra una nueva cancha asignando el siguiente id disponible
         * @param {string} nombre
         * @param {string} tipo Uno de: Fútbol 5, Fútbol 7, Fútbol 8
         * @param {number} tarifaBase
         * @param {number} tarifaHoraPico
         * @param {number} tarifaFestivo
         * @returns {Cancha}
         * @throws {Error} Si los datos no son válidos o el nombre ya existe
         */
        registrarCancha(nombre, tipo, tarifaBase, tarifaHoraPico, tarifaFestivo) {
            const nombreLimpio = String(nombre || '').trim();
            if (!TIPOS.includes(tipo)) {
                throw new Error(`El tipo debe ser uno de: ${TIPOS.join(', ')}`);
            }
            const repetida = this.canchaDAO.obtenerTodas()
                .some((c) => c.nombre.toLowerCase() === nombreLimpio.toLowerCase());
            if (repetida) {
                throw new Error(`Ya existe una cancha llamada "${nombreLimpio}"`);
            }
            return this.crearCancha(this.canchaDAO.siguienteId(), nombreLimpio, tipo,
                Number(tarifaBase), Number(tarifaHoraPico), Number(tarifaFestivo));
        }

        /**
         * Contrato: Modifica las tarifas dinámicas de una cancha existente
         * @param {number} id
         * @param {number} tarifaBase
         * @param {number} tarifaHoraPico
         * @param {number} tarifaFestivo
         * @returns {Cancha} Cancha con las tarifas actualizadas
         * @throws {Error} Si la cancha no existe o las tarifas no son válidas
         */
        actualizarTarifas(id, tarifaBase, tarifaHoraPico, tarifaFestivo) {
            this.validarTarifas(tarifaBase, tarifaHoraPico, tarifaFestivo);
            const cancha = this.canchaDAO.actualizar(id, { tarifaBase, tarifaHoraPico, tarifaFestivo });
            if (!cancha) {
                throw new Error(`No existe una cancha con id ${id}`);
            }
            return cancha;
        }

        /**
         * Contrato: Habilita o inhabilita una cancha para la venta
         * @param {number} id
         * @param {boolean} habilitada
         * @returns {Cancha}
         * @throws {Error} Si la cancha no existe
         */
        cambiarEstado(id, habilitada) {
            const cancha = this.canchaDAO.actualizar(id, { habilitada });
            if (!cancha) {
                throw new Error(`No existe una cancha con id ${id}`);
            }
            return cancha;
        }

        /**
         * Contrato: Valor por hora de una cancha para una fecha y hora dadas (sin validar estado).
         * Regla de negocio: festivo/domingo > hora pico (18:00-21:59) > tarifa base.
         * @param {Cancha} cancha
         * @param {string} fecha Fecha 'AAAA-MM-DD'
         * @param {number} hora Hora de inicio del turno
         * @param {boolean} [esFestivo] Si se omite se consulta el calendario de festivos
         * @returns {number} Valor por hora (COP)
         */
        tarifaFranja(cancha, fecha, hora, esFestivo = Fechas.esFestivo(fecha)) {
            const esDomingo = Fechas.aDate(fecha).getDay() === 0;
            if (esFestivo || esDomingo) {
                return cancha.tarifaFestivo;
            }
            if (CanchaController.esHoraPico(hora)) {
                return cancha.tarifaHoraPico;
            }
            return cancha.tarifaBase;
        }

        /**
         * Contrato: Calcula el valor por hora de una cancha según la fecha y hora de juego.
         * @param {number} id Identificador de la cancha
         * @param {Date} fechaHora Fecha y hora de inicio del turno
         * @param {boolean} [esFestivo] Indica si la fecha es festivo nacional (por defecto usa el calendario)
         * @returns {number} Valor a cobrar por hora (COP)
         * @throws {Error} Si la cancha no existe o está inhabilitada
         */
        calcularTarifa(id, fechaHora, esFestivo) {
            const cancha = this.obtenerCancha(id);
            if (!cancha.habilitada) {
                throw new Error(`${cancha.nombre} está inhabilitada para la venta`);
            }
            const fecha = Fechas.aISO(fechaHora);
            return this.tarifaFranja(cancha, fecha, fechaHora.getHours(),
                esFestivo === undefined ? Fechas.esFestivo(fecha) : esFestivo);
        }

        /**
         * Contrato: Valida que las tarifas sean números positivos
         * y que la tarifa base no supere a la de hora pico ni a la de festivo.
         * @param {number} tarifaBase
         * @param {number} tarifaHoraPico
         * @param {number} tarifaFestivo
         * @throws {Error} Si alguna tarifa no es válida
         */
        validarTarifas(tarifaBase, tarifaHoraPico, tarifaFestivo) {
            const tarifas = [tarifaBase, tarifaHoraPico, tarifaFestivo];
            if (tarifas.some((t) => typeof t !== 'number' || Number.isNaN(t) || t <= 0)) {
                throw new Error('Las tarifas deben ser números mayores que cero');
            }
            if (tarifaHoraPico < tarifaBase || tarifaFestivo < tarifaBase) {
                throw new Error('Las tarifas de hora pico y festivo no pueden ser menores que la tarifa base');
            }
        }

        /**
         * Contrato: Indica si una hora pertenece a la franja pico
         * @param {number} hora
         * @returns {boolean}
         */
        static esHoraPico(hora) {
            return hora >= HORA_PICO_INICIO && hora < HORA_PICO_FIN;
        }
    }

    CanchaController.HORA_PICO_INICIO = HORA_PICO_INICIO;
    CanchaController.HORA_PICO_FIN = HORA_PICO_FIN;
    CanchaController.TIPOS = TIPOS;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CanchaController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).CanchaController = CanchaController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
