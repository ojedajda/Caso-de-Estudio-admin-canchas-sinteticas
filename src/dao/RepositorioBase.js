/**
 * DAO genérico (HU01 - arquitectura base).
 * Centraliza las operaciones CRUD para que cada DAO concreto solo agregue sus consultas.
 * Refactorización: evita repetir el mismo código de persistencia en cada entidad.
 */
(function (global) {
    'use strict';

    class RepositorioBase {
        /**
         * @param {Object|null} almacen Almacén de datos (null = solo memoria)
         * @param {string} coleccion Nombre de la colección (tabla)
         * @param {Function} Modelo Clase del modelo; debe tener el método estático desde(obj)
         * @param {Array<Object>} [semilla=[]] Registros iniciales si la colección está vacía
         */
        constructor(almacen, coleccion, Modelo, semilla = []) {
            this.almacen = almacen;
            this.coleccion = coleccion;
            this.Modelo = Modelo;
            const guardados = almacen ? almacen.leer(coleccion) : null;
            this.registros = (guardados || semilla).map((obj) => Modelo.desde(obj));
        }

        /** Contrato de método: Guarda la colección en el almacén */
        persistir() {
            if (this.almacen) {
                this.almacen.escribir(this.coleccion, this.registros);
            }
        }

        /**
         * Contrato de método: Retorna todos los registros
         * @returns {Array<Object>}
         */
        obtenerTodas() {
            return this.registros;
        }

        /**
         * Contrato de método: Busca un registro por su identificador
         * @param {number} id
         * @returns {Object|undefined}
         */
        buscarPorId(id) {
            return this.registros.find((registro) => registro.id === Number(id));
        }

        /**
         * Contrato de método: Retorna los registros que cumplen una condición
         * @param {Function} condicion
         * @returns {Array<Object>}
         */
        filtrar(condicion) {
            return this.registros.filter(condicion);
        }

        /**
         * Contrato de método: Calcula el siguiente identificador disponible
         * @returns {number}
         */
        siguienteId() {
            return this.registros.reduce((max, registro) => Math.max(max, registro.id), 0) + 1;
        }

        /**
         * Contrato de método: Inserta un registro
         * @param {Object} registro
         * @returns {Object} Registro guardado
         */
        guardar(registro) {
            this.registros.push(registro);
            this.persistir();
            return registro;
        }

        /**
         * Contrato de método: Actualiza los campos de un registro existente
         * @param {number} id
         * @param {Object} cambios
         * @returns {Object|undefined} Registro actualizado o undefined si no existe
         */
        actualizar(id, cambios) {
            const registro = this.buscarPorId(id);
            if (!registro) {
                return undefined;
            }
            Object.assign(registro, cambios);
            this.persistir();
            return registro;
        }

        /**
         * Contrato de método: Elimina un registro
         * @param {number} id
         * @returns {boolean} true si se eliminó
         */
        eliminar(id) {
            const indice = this.registros.findIndex((registro) => registro.id === Number(id));
            if (indice < 0) {
                return false;
            }
            this.registros.splice(indice, 1);
            this.persistir();
            return true;
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RepositorioBase;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).RepositorioBase = RepositorioBase;
    }
})(typeof window !== 'undefined' ? window : globalThis);
