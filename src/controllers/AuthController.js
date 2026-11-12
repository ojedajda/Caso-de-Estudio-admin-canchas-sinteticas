/**
 * Controlador (Facade) de Inicio de Sesión y Roles (Issue #29 - mejora fuera de las 12 HU)
 * Reglas:
 *  - Sin sesión solo se puede usar el grupo "Cliente" (reservar, disponibilidad, etc.).
 *  - RECEPCION ve "Cliente" y "Recepción"; ADMINISTRADOR ve los tres grupos.
 *  - 5 contraseñas incorrectas seguidas bloquean el acceso durante 1 minuto.
 *  - La sesión caduca a las 2 horas y se puede cerrar en cualquier momento.
 * Limitación: es un control en el navegador, no seguridad de servidor (ver README).
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Hash = importar('../utils/Hash', 'Hash');

    const MAX_INTENTOS = 5;
    const BLOQUEO_MS = 60 * 1000;
    const SESION_MS = 2 * 60 * 60 * 1000;
    const GRUPOS_POR_ROL = {
        ADMINISTRADOR: ['Cliente', 'Recepción', 'Administración'],
        RECEPCION: ['Cliente', 'Recepción']
    };
    const NOMBRE_ROL = { ADMINISTRADOR: 'Administrador', RECEPCION: 'Recepción' };
    const MENSAJE_INVALIDO = 'Usuario o contraseña incorrectos';

    class AuthController {
        /**
         * @param {Object} deps Dependencias: usuarioDAO
         */
        constructor(deps) {
            this.deps = deps;
            this.estado = { sesion: null, intentos: {} };
            this.almacenSesion = null;
        }

        /**
         * Contrato: Conecta un almacenamiento para que la sesión y los intentos sobrevivan a recargar la página
         * @param {{leer: Function, guardar: Function}} almacenSesion
         */
        usarAlmacenSesion(almacenSesion) {
            this.almacenSesion = almacenSesion;
            const guardado = almacenSesion.leer();
            if (guardado && typeof guardado === 'object') {
                this.estado = { sesion: guardado.sesion || null, intentos: guardado.intentos || {} };
            }
        }

        /** Guarda el estado en el almacenamiento de sesión si hay uno conectado */
        guardar() {
            if (this.almacenSesion) {
                this.almacenSesion.guardar(this.estado);
            }
        }

        /**
         * Contrato: Inicia sesión con usuario y contraseña
         * @param {string} usuario
         * @param {string} clave
         * @param {Date} [ahora=new Date()]
         * @returns {{usuario: string, nombre: string, rol: string, expira: number}} Sesión (sin datos de la contraseña)
         * @throws {Error} Si faltan datos, las credenciales no son válidas o el acceso está bloqueado
         */
        iniciarSesion(usuario, clave, ahora = new Date()) {
            const nombreUsuario = String(usuario || '').trim();
            if (!nombreUsuario || !clave) {
                throw new Error('Escribe tu usuario y tu contraseña');
            }
            const llave = nombreUsuario.toLowerCase();
            const intento = this.estado.intentos[llave] || { fallos: 0, bloqueadoHasta: 0 };
            if (intento.bloqueadoHasta > ahora.getTime()) {
                const segundos = Math.ceil((intento.bloqueadoHasta - ahora.getTime()) / 1000);
                throw new Error(`Demasiados intentos fallidos. Intenta de nuevo en ${segundos} s`);
            }
            const registro = this.deps.usuarioDAO.buscarPorUsuario(nombreUsuario);
            // Se calcula siempre el hash para que la respuesta tarde igual exista o no el usuario
            const calculado = Hash.derivar(String(clave), registro ? registro.sal : 'cg-sin-usuario');
            if (!registro || !Hash.iguales(calculado, registro.hash)) {
                const fallos = (intento.fallos >= MAX_INTENTOS ? 0 : intento.fallos) + 1;
                this.estado.intentos[llave] = fallos >= MAX_INTENTOS
                    ? { fallos: 0, bloqueadoHasta: ahora.getTime() + BLOQUEO_MS }
                    : { fallos, bloqueadoHasta: 0 };
                this.guardar();
                if (fallos >= MAX_INTENTOS) {
                    throw new Error('Demasiados intentos fallidos. El acceso quedó bloqueado por 1 minuto');
                }
                throw new Error(`${MENSAJE_INVALIDO} (te quedan ${MAX_INTENTOS - fallos} intentos)`);
            }
            delete this.estado.intentos[llave];
            this.estado.sesion = { usuario: registro.usuario, nombre: registro.nombre, rol: registro.rol, expira: ahora.getTime() + SESION_MS };
            this.guardar();
            return { ...this.estado.sesion };
        }

        /**
         * Contrato: Sesión vigente (si caducó la cierra)
         * @param {Date} [ahora=new Date()]
         * @returns {{usuario: string, nombre: string, rol: string, expira: number}|null}
         */
        sesionActual(ahora = new Date()) {
            const sesion = this.estado.sesion;
            if (sesion && sesion.expira <= ahora.getTime()) {
                this.cerrarSesion();
                return null;
            }
            return sesion ? { ...sesion } : null;
        }

        /** Contrato: Cierra la sesión actual */
        cerrarSesion() {
            this.estado.sesion = null;
            this.guardar();
        }

        /**
         * Contrato: Grupos del menú que puede usar quien está en este momento en la página
         * @param {Date} [ahora=new Date()]
         * @returns {Array<string>}
         */
        gruposPermitidos(ahora = new Date()) {
            const sesion = this.sesionActual(ahora);
            return sesion && GRUPOS_POR_ROL[sesion.rol] ? GRUPOS_POR_ROL[sesion.rol] : ['Cliente'];
        }

        /**
         * Contrato: Indica si se puede usar un grupo del menú
         * @param {string} grupo
         * @param {Date} [ahora=new Date()]
         * @returns {boolean}
         */
        puedeVerGrupo(grupo, ahora = new Date()) {
            return this.gruposPermitidos(ahora).includes(grupo);
        }

        /**
         * Contrato: Exige poder usar un grupo del menú
         * @param {string} grupo
         * @param {Date} [ahora=new Date()]
         * @throws {Error} Si no hay sesión o el rol no alcanza
         */
        exigirGrupo(grupo, ahora = new Date()) {
            if (!this.puedeVerGrupo(grupo, ahora)) {
                throw new Error(this.sesionActual(ahora)
                    ? `Tu rol no tiene acceso a la sección ${grupo}`
                    : `Inicia sesión para entrar a la sección ${grupo}`);
            }
        }

        /**
         * Contrato: Indica si quien está en la página es administrador
         * @param {Date} [ahora=new Date()]
         * @returns {boolean}
         */
        esAdministrador(ahora = new Date()) {
            const sesion = this.sesionActual(ahora);
            return Boolean(sesion && sesion.rol === 'ADMINISTRADOR');
        }

        /** @param {string} rol @returns {string} Nombre del rol para mostrar */
        nombreRol(rol) {
            return NOMBRE_ROL[rol] || rol;
        }
    }

    AuthController.MAX_INTENTOS = MAX_INTENTOS;
    AuthController.BLOQUEO_MS = BLOQUEO_MS;
    AuthController.SESION_MS = SESION_MS;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AuthController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).AuthController = AuthController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
