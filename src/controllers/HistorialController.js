/**
 * Controlador (Facade) de Historial de Reservas y Repetición de Turno Frecuente (HU10)
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Fechas = importar('../utils/Fechas', 'Fechas');
    const Reserva = importar('../models/Reserva', 'Reserva');

    /** Semanas hacia adelante en las que se busca un cupo para repetir el turno */
    const SEMANAS_BUSQUEDA = 4;

    class HistorialController {
        /**
         * @param {Object} deps Dependencias: reservaDAO, canchaDAO, reservas y disponibilidad
         */
        constructor(deps) {
            this.deps = deps;
        }

        /**
         * Contrato: Historial completo de un cliente con un resumen de sus hábitos
         * @param {string} telefono
         * @returns {{reservas: Array<Reserva>, resumen: Object}}
         */
        historial(telefono) {
            const reservas = this.deps.reservaDAO.buscarPorTelefono(telefono).slice()
                .sort((a, b) => (b.fecha + String(b.hora).padStart(2, '0')).localeCompare(a.fecha + String(a.hora).padStart(2, '0')));
            const jugadas = reservas.filter((r) => r.estado === Reserva.ESTADOS.INGRESADA);
            const frecuente = this.turnoFrecuente(telefono);
            return {
                reservas,
                resumen: {
                    total: reservas.length,
                    jugadas: jugadas.length,
                    canceladas: reservas.filter((r) => !r.estaActiva()).length,
                    invertido: jugadas.reduce((total, r) => total + r.valorTotal, 0),
                    turnoFrecuente: frecuente
                }
            };
        }

        /**
         * Contrato: Turno más repetido del cliente (cancha, día de la semana y hora)
         * @param {string} telefono
         * @returns {{canchaId: number, cancha: string, dia: string, hora: number, veces: number}|null}
         */
        turnoFrecuente(telefono) {
            const conteo = {};
            this.deps.reservaDAO.buscarPorTelefono(telefono)
                .filter((r) => r.estaActiva())
                .forEach((r) => {
                    const llave = `${r.canchaId}|${Fechas.nombreDia(r.fecha)}|${r.hora}`;
                    conteo[llave] = (conteo[llave] || 0) + 1;
                });
            const [mejor] = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
            if (!mejor) {
                return null;
            }
            const [canchaId, dia, hora] = mejor[0].split('|');
            const cancha = this.deps.canchaDAO.buscarPorId(Number(canchaId));
            return { canchaId: Number(canchaId), cancha: cancha ? cancha.nombre : '', dia, hora: Number(hora), veces: mejor[1] };
        }

        /**
         * Contrato: Fecha libre más cercana para repetir un turno (mismo día de la semana, cancha y hora)
         * @param {Reserva} base Reserva que se quiere repetir
         * @param {Date} [ahora=new Date()]
         * @returns {string|null} Fecha 'AAAA-MM-DD' o null si no hay cupo en las próximas semanas
         */
        proximaFechaDisponible(base, ahora = new Date()) {
            let fecha = base.fecha;
            while (Fechas.horasHasta(fecha, base.hora, ahora) <= 0) {
                fecha = Fechas.sumarDias(fecha, 7);
            }
            if (fecha === base.fecha) {
                fecha = Fechas.sumarDias(fecha, 7);
            }
            for (let i = 0; i < SEMANAS_BUSQUEDA; i++) {
                const libres = this.deps.disponibilidad.horasLibres(base.canchaId, fecha, ahora);
                if (libres.includes(base.hora)) {
                    return fecha;
                }
                fecha = Fechas.sumarDias(fecha, 7);
            }
            return null;
        }

        /**
         * Contrato: Crea una nueva reserva repitiendo un turno anterior del cliente
         * @param {string} codigo Reserva que se quiere repetir
         * @param {string} metodoPago Medio de pago del anticipo
         * @param {Date} [ahora=new Date()]
         * @returns {Reserva} Nueva reserva confirmada
         * @throws {Error} Si no hay cupo en las próximas semanas
         */
        repetirTurno(codigo, metodoPago, ahora = new Date()) {
            const base = this.deps.reservas.obtenerPorCodigo(codigo);
            const fecha = this.proximaFechaDisponible(base, ahora);
            if (!fecha) {
                throw new Error(`No hay cupo para repetir el turno en las próximas ${SEMANAS_BUSQUEDA} semanas`);
            }
            return this.deps.reservas.crearReserva({
                canchaId: base.canchaId,
                fecha,
                hora: base.hora,
                nombre: base.clienteNombre,
                telefono: base.clienteTelefono,
                metodoPago,
                canal: 'WEB'
            }, ahora);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = HistorialController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).HistorialController = HistorialController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
