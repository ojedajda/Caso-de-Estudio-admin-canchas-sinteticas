/**
 * Controlador (Facade) de Creación de Promociones y Descuentos (HU05)
 * Los cupones incentivan las reservas en horas de baja demanda (horario valle).
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Fechas = importar('../utils/Fechas', 'Fechas');
    const Promocion = importar('../models/Promocion', 'Promocion');
    const CanchaController = importar('./CanchaController', 'CanchaController');

    const TIPOS = ['PORCENTAJE', 'MONTO'];

    class PromocionController {
        /**
         * @param {Object} deps Dependencias: promocionDAO
         */
        constructor(deps) {
            this.deps = deps;
        }

        /**
         * Contrato: Crea un cupón de descuento
         * @param {Object} datos
         * @param {string} datos.codigo 4 a 15 letras o números
         * @param {string} [datos.descripcion]
         * @param {string} datos.tipo PORCENTAJE o MONTO
         * @param {number} datos.valor Porcentaje (1-90) o monto en COP
         * @param {string} datos.fechaInicio
         * @param {string} datos.fechaFin
         * @param {boolean} [datos.soloHorarioValle=false]
         * @returns {Promocion}
         * @throws {Error} Si algún dato no es válido o el código ya existe
         */
        crear(datos) {
            const codigo = String(datos.codigo || '').trim().toUpperCase();
            const valor = Number(datos.valor);
            if (!/^[A-Z0-9]{4,15}$/.test(codigo)) {
                throw new Error('El código debe tener de 4 a 15 letras o números, sin espacios');
            }
            if (this.deps.promocionDAO.buscarPorCodigo(codigo)) {
                throw new Error(`Ya existe una promoción con el código ${codigo}`);
            }
            if (!TIPOS.includes(datos.tipo)) {
                throw new Error('El tipo debe ser PORCENTAJE o MONTO');
            }
            if (datos.tipo === 'PORCENTAJE' && !(valor >= 1 && valor <= 90)) {
                throw new Error('El porcentaje debe estar entre 1 y 90');
            }
            if (datos.tipo === 'MONTO' && !(valor > 0)) {
                throw new Error('El monto del descuento debe ser mayor que cero');
            }
            if (!Fechas.esFechaValida(datos.fechaInicio) || !Fechas.esFechaValida(datos.fechaFin)
                || datos.fechaFin < datos.fechaInicio) {
                throw new Error('El rango de vigencia no es válido');
            }
            return this.deps.promocionDAO.guardar(new Promocion({
                id: this.deps.promocionDAO.siguienteId(),
                codigo,
                descripcion: String(datos.descripcion || '').trim(),
                tipo: datos.tipo,
                valor,
                fechaInicio: datos.fechaInicio,
                fechaFin: datos.fechaFin,
                soloHorarioValle: Boolean(datos.soloHorarioValle)
            }));
        }

        /**
         * Contrato: Valida que un cupón aplique a una fecha y hora
         * @param {string} codigo
         * @param {string} fecha
         * @param {number} hora
         * @returns {Promocion}
         * @throws {Error} Con el motivo por el que el cupón no aplica
         */
        validar(codigo, fecha, hora) {
            const promocion = this.deps.promocionDAO.buscarPorCodigo(codigo);
            if (!promocion) {
                throw new Error(`El cupón ${String(codigo).toUpperCase()} no existe`);
            }
            if (!promocion.activa) {
                throw new Error(`El cupón ${promocion.codigo} está desactivado`);
            }
            if (fecha < promocion.fechaInicio || fecha > promocion.fechaFin) {
                throw new Error(`El cupón ${promocion.codigo} es válido del ${promocion.fechaInicio} al ${promocion.fechaFin}`);
            }
            if (promocion.soloHorarioValle && (CanchaController.esHoraPico(Number(hora)) || Fechas.esDomingoOFestivo(fecha))) {
                throw new Error(`El cupón ${promocion.codigo} solo aplica en horario valle (lunes a sábado antes de las 18:00)`);
            }
            return promocion;
        }

        /**
         * Contrato: Calcula el descuento de un cupón sobre un valor
         * @param {Promocion} promocion
         * @param {number} valor
         * @returns {number} Descuento en COP (nunca mayor que el valor)
         */
        calcularDescuento(promocion, valor) {
            const descuento = promocion.tipo === 'PORCENTAJE'
                ? Math.round((valor * promocion.valor) / 100)
                : promocion.valor;
            return Math.min(descuento, valor);
        }

        /**
         * Contrato: Suma un uso al cupón
         * @param {string} codigo
         */
        registrarUso(codigo) {
            const promocion = this.deps.promocionDAO.buscarPorCodigo(codigo);
            if (promocion) {
                this.deps.promocionDAO.actualizar(promocion.id, { usos: promocion.usos + 1 });
            }
        }

        /**
         * Contrato: Activa o desactiva un cupón
         * @param {number} id
         * @param {boolean} activa
         * @returns {Promocion}
         * @throws {Error} Si no existe
         */
        cambiarEstado(id, activa) {
            const promocion = this.deps.promocionDAO.actualizar(id, { activa: Boolean(activa) });
            if (!promocion) {
                throw new Error(`No existe una promoción con id ${id}`);
            }
            return promocion;
        }

        /**
         * Contrato: Lista de cupones
         * @returns {Array<Promocion>}
         */
        listar() {
            return this.deps.promocionDAO.obtenerTodas();
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PromocionController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).PromocionController = PromocionController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
