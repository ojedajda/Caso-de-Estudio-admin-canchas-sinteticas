/**
 * Clase DAO para la persistencia de los usuarios del personal (Issue #29 - Inicio de sesión)
 * Trae dos cuentas de demostración (ver README); sus contraseñas se guardan solo como hash.
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Usuario = importar('../models/Usuario', 'Usuario');
    const RepositorioBase = importar('./RepositorioBase', 'RepositorioBase');

    /** Cuentas de demostración: solo sal y hash, nunca la contraseña */
    const SEMILLA = [
        { id: 1, usuario: 'admin', nombre: 'Administrador', rol: 'ADMINISTRADOR', sal: 'cg-admin-7f3a91c2',
            hash: 'b9ac305b748ec9246e66a9190e975a435084cb02d302100c3f410cbf9d591d28' },
        { id: 2, usuario: 'recepcion', nombre: 'Recepción', rol: 'RECEPCION', sal: 'cg-recepcion-5b8e04d1',
            hash: '5f92dfa89b7ce8b3c02c7d79fb144c8909bba810cf945352d9da3097000c2ed5' }
    ];

    class UsuarioDAO extends RepositorioBase {
        /** @param {Object|null} [almacen=null] */
        constructor(almacen = null) {
            super(almacen, 'usuarios', Usuario, SEMILLA);
        }

        /**
         * Contrato de método: Busca un usuario por su nombre de usuario (sin distinguir mayúsculas)
         * @param {string} usuario
         * @returns {Usuario|undefined}
         */
        buscarPorUsuario(usuario) {
            const buscado = String(usuario || '').trim().toLowerCase();
            return this.registros.find((u) => u.usuario.toLowerCase() === buscado);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = UsuarioDAO;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).UsuarioDAO = UsuarioDAO;
    }
})(typeof window !== 'undefined' ? window : globalThis);
