/**
 * Modelo de datos que representa la entidad Usuario del personal (Issue #29 - Inicio de sesión)
 * Nunca guarda la contraseña: solo la sal y el hash con que se verifica.
 */
(function (global) {
    'use strict';

    class Usuario {
        /** Roles del personal; los clientes no necesitan cuenta para reservar */
        static get ROLES() {
            return { ADMINISTRADOR: 'ADMINISTRADOR', RECEPCION: 'RECEPCION' };
        }

        /**
         * @param {number} id
         * @param {string} usuario Nombre de usuario para iniciar sesión
         * @param {string} nombre Nombre para mostrar
         * @param {string} rol ADMINISTRADOR o RECEPCION
         * @param {string} sal Texto propio del usuario usado al calcular el hash
         * @param {string} hash Hash de la contraseña (nunca la contraseña en texto)
         */
        constructor(id, usuario, nombre, rol, sal, hash) {
            this.id = id;
            this.usuario = usuario;
            this.nombre = nombre;
            this.rol = rol;
            this.sal = sal;
            this.hash = hash;
        }

        /**
         * Contrato: Reconstruye un Usuario a partir de un objeto plano
         * @param {Object} obj
         * @returns {Usuario}
         */
        static desde(obj) {
            return new Usuario(obj.id, obj.usuario, obj.nombre, obj.rol, obj.sal, obj.hash);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Usuario;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).Usuario = Usuario;
    }
})(typeof window !== 'undefined' ? window : globalThis);
