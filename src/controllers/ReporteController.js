/**
 * Controlador (Facade) de Reporte y Monitoreo de Recaudos Diarios (HU06)
 * Consolida los movimientos de caja de un día para el cierre y la auditoría.
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Reserva = importar('../models/Reserva', 'Reserva');

    class ReporteController {
        /**
         * @param {Object} deps Dependencias: pagoDAO, reservaDAO, canchaDAO y disponibilidad
         */
        constructor(deps) {
            this.deps = deps;
        }

        /**
         * Contrato: Recaudo y métricas de un día
         * @param {string} fecha 'AAAA-MM-DD'
         * @param {Date} [ahora=new Date()]
         * @returns {Object} Totales por tipo, por medio de pago, por cancha, movimientos e indicadores
         * @throws {Error} Si la fecha no es válida
         */
        recaudoDiario(fecha, ahora = new Date()) {
            this.deps.disponibilidad.validarFecha(fecha);
            const movimientos = this.deps.pagoDAO.buscarPorFecha(fecha)
                .sort((a, b) => a.hora.localeCompare(b.hora) || a.id - b.id);
            const caja = movimientos.filter((p) => p.esMovimientoDeCaja());
            const sumar = (lista) => lista.reduce((total, p) => total + p.monto, 0);
            const porTipo = (tipo) => sumar(caja.filter((p) => p.tipo === tipo));

            const porMetodo = {};
            caja.forEach((p) => {
                porMetodo[p.metodo] = (porMetodo[p.metodo] || 0) + p.monto;
            });

            const porCancha = this.deps.canchaDAO.obtenerTodas().map((cancha) => {
                const ids = new Set(this.deps.reservaDAO.filtrar((r) => r.canchaId === cancha.id).map((r) => r.id));
                const delaCancha = caja.filter((p) => ids.has(p.reservaId));
                return { cancha: cancha.nombre, movimientos: delaCancha.length, total: sumar(delaCancha) };
            });

            const reservasDelDia = this.deps.reservaDAO.buscarPorFecha(fecha);
            const contar = (estado) => reservasDelDia.filter((r) => r.estado === estado).length;
            return {
                fecha,
                anticipos: porTipo('ANTICIPO'),
                saldos: porTipo('SALDO'),
                pagosTotales: porTipo('TOTAL'),
                reembolsos: porTipo('REEMBOLSO'),
                saldoAFavorUsado: sumar(movimientos.filter((p) => !p.esMovimientoDeCaja())),
                totalNeto: sumar(caja),
                porMetodo,
                porCancha,
                movimientos,
                indicadores: {
                    turnosDelDia: reservasDelDia.filter((r) => r.estaActiva()).length,
                    confirmadas: contar(Reserva.ESTADOS.CONFIRMADA),
                    ingresadas: contar(Reserva.ESTADOS.INGRESADA),
                    canceladas: contar(Reserva.ESTADOS.CANCELADA) + contar(Reserva.ESTADOS.CANCELADA_BLOQUEO),
                    saldoPorCobrar: reservasDelDia.filter((r) => r.estado === Reserva.ESTADOS.CONFIRMADA)
                        .reduce((total, r) => total + r.saldoPendiente, 0),
                    ocupacion: this.deps.disponibilidad.resumen(fecha, ahora).ocupacion
                }
            };
        }

        /**
         * Contrato: Exporta los movimientos del día en formato CSV (abre en Excel)
         * @param {string} fecha
         * @returns {string} Texto CSV separado por punto y coma
         */
        exportarCSV(fecha) {
            const reporte = this.recaudoDiario(fecha);
            const filas = [['Fecha', 'Hora', 'Reserva', 'Tipo', 'Medio de pago', 'Referencia', 'Monto']];
            reporte.movimientos.forEach((p) => {
                filas.push([p.fecha, p.hora, p.codigoReserva, p.tipo, p.metodo, p.referencia, p.monto]);
            });
            filas.push([]);
            filas.push(['', '', '', '', '', 'TOTAL NETO', reporte.totalNeto]);
            return filas.map((fila) => fila.join(';')).join('\n');
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ReporteController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).ReporteController = ReporteController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
