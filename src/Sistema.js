/**
 * Ensamblador del sistema CanchaGO (HU01 - arquitectura base).
 * Crea los DAO y los controladores (fachadas) y les inyecta sus dependencias.
 * Cada módulo es opcional: si una historia de usuario aún no está integrada, simplemente
 * no se instancia (principio abierto/cerrado: se extiende sin modificar lo existente).
 */
(function (global) {
    'use strict';

    /**
     * Contrato: Obtiene una clase del sistema si está disponible
     * @param {string} ruta Ruta relativa para Node
     * @param {string} nombre Nombre global en el navegador
     * @returns {Function|undefined}
     */
    function cargar(ruta, nombre) {
        if (typeof require === 'function') {
            try {
                return require(ruta);
            } catch (error) {
                if (error.code === 'MODULE_NOT_FOUND') {
                    return undefined;
                }
                throw error;
            }
        }
        return (global.CanchaGO || {})[nombre];
    }

    /**
     * Contrato: Construye el sistema completo
     * @param {Object|null} [almacen=null] Almacén de datos (null = memoria)
     * @returns {Object} Objeto con los controladores disponibles y sus DAO en "daos"
     */
    function crearSistema(almacen = null) {
        const daos = {};
        const sistema = { daos, almacen };
        const DAOS = {
            canchaDAO: ['./dao/CanchaDAO', 'CanchaDAO'],
            reservaDAO: ['./dao/ReservaDAO', 'ReservaDAO'],
            clienteDAO: ['./dao/ClienteDAO', 'ClienteDAO'],
            pagoDAO: ['./dao/PagoDAO', 'PagoDAO'],
            notificacionDAO: ['./dao/NotificacionDAO', 'NotificacionDAO'],
            promocionDAO: ['./dao/PromocionDAO', 'PromocionDAO'],
            bloqueoDAO: ['./dao/BloqueoDAO', 'BloqueoDAO'],
            resenaDAO: ['./dao/ResenaDAO', 'ResenaDAO'],
            usuarioDAO: ['./dao/UsuarioDAO', 'UsuarioDAO']
        };
        Object.entries(DAOS).forEach(([clave, [ruta, nombre]]) => {
            const Clase = cargar(ruta, nombre);
            if (Clase) {
                daos[clave] = new Clase(almacen);
            }
        });

        // El orden importa: cada controlador queda disponible en "daos" para los siguientes.
        const CONTROLADORES = [
            ['canchas', 'canchaController', './controllers/CanchaController', 'CanchaController'],
            ['notificaciones', 'notificador', './controllers/NotificacionController', 'NotificacionController'],
            ['promociones', 'promociones', './controllers/PromocionController', 'PromocionController'],
            ['disponibilidad', 'disponibilidad', './controllers/DisponibilidadController', 'DisponibilidadController'],
            ['reservas', 'reservas', './controllers/ReservaController', 'ReservaController'],
            ['acceso', 'acceso', './controllers/AccesoController', 'AccesoController'],
            ['taquilla', 'taquilla', './controllers/TaquillaController', 'TaquillaController'],
            ['reportes', 'reportes', './controllers/ReporteController', 'ReporteController'],
            ['gestion', 'gestion', './controllers/GestionReservaController', 'GestionReservaController'],
            ['historial', 'historial', './controllers/HistorialController', 'HistorialController'],
            ['bloqueos', 'bloqueos', './controllers/BloqueoController', 'BloqueoController'],
            ['resenas', 'resenas', './controllers/ResenaController', 'ResenaController'],
            ['auth', 'auth', './controllers/AuthController', 'AuthController']
        ];
        CONTROLADORES.forEach(([nombreSistema, nombreDep, ruta, nombre]) => {
            const Clase = cargar(ruta, nombre);
            if (!Clase) {
                return;
            }
            const instancia = nombreSistema === 'canchas' ? new Clase(daos.canchaDAO) : new Clase(daos);
            sistema[nombreSistema] = instancia;
            daos[nombreDep] = instancia;
        });
        return sistema;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { crearSistema };
    } else {
        (global.CanchaGO = global.CanchaGO || {}).crearSistema = crearSistema;
    }
})(typeof window !== 'undefined' ? window : globalThis);
