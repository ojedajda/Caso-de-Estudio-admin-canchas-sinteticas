/**
 * Almacén de datos simulado (HU01 - arquitectura base).
 * Simula la integración con Base de Datos: en el navegador persiste en localStorage
 * y en Node trabaja solo en memoria. Los DAO no saben cuál de los dos se usa.
 */
(function (global) {
    'use strict';

    class Almacen {
        /**
         * @param {string} [prefijo='canchago'] Prefijo de las llaves (equivale al nombre de la BD)
         * @param {boolean} [usarLocalStorage=true] Si es false trabaja solo en memoria
         */
        constructor(prefijo = 'canchago', usarLocalStorage = true) {
            this.prefijo = prefijo;
            this.memoria = {};
            this.ls = null;
            try {
                if (usarLocalStorage && global.localStorage) {
                    this.ls = global.localStorage;
                }
            } catch (error) {
                this.ls = null;
            }
        }

        /**
         * Contrato de método: Lee una colección (equivale a una tabla)
         * @param {string} coleccion
         * @returns {Array<Object>|null} Registros guardados o null si la colección no existe
         */
        leer(coleccion) {
            const llave = `${this.prefijo}:${coleccion}`;
            if (this.ls) {
                const texto = this.ls.getItem(llave);
                return texto ? JSON.parse(texto) : null;
            }
            return this.memoria[llave] ? JSON.parse(this.memoria[llave]) : null;
        }

        /**
         * Contrato de método: Escribe una colección completa
         * @param {string} coleccion
         * @param {Array<Object>} registros
         */
        escribir(coleccion, registros) {
            const llave = `${this.prefijo}:${coleccion}`;
            const texto = JSON.stringify(registros);
            if (this.ls) {
                this.ls.setItem(llave, texto);
            } else {
                this.memoria[llave] = texto;
            }
        }

        /**
         * Contrato de método: Elimina todas las colecciones del almacén
         */
        limpiar() {
            if (this.ls) {
                Object.keys(this.ls)
                    .filter((llave) => llave.startsWith(`${this.prefijo}:`))
                    .forEach((llave) => this.ls.removeItem(llave));
            }
            this.memoria = {};
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Almacen;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).Almacen = Almacen;
    }
})(typeof window !== 'undefined' ? window : globalThis);
