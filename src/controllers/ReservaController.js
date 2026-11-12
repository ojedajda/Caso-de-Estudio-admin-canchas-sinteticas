/**
 * Controlador (Facade) de Reserva de Cancha con Pago de Anticipo (HU02)
 * Reglas: el turno se confirma solo con el pago del anticipo (50 %) a través de la
 * pasarela simulada; antes de guardar se valida de nuevo la franja (control de concurrencia).
 */
(function (global) {
    'use strict';
    const importar = (ruta, nombre) => (typeof require === 'function' ? require(ruta) : global.CanchaGO[nombre]);
    const Fechas = importar('../utils/Fechas', 'Fechas');
    const Reserva = importar('../models/Reserva', 'Reserva');
    const Cliente = importar('../models/Cliente', 'Cliente');
    const Pago = importar('../models/Pago', 'Pago');

    /** Porcentaje del valor del turno que se cobra como anticipo */
    const PORCENTAJE_ANTICIPO = 0.5;
    /** Medios de pago de la pasarela web (simulada) */
    const METODOS_WEB = ['TARJETA', 'PSE', 'NEQUI'];
    /** Medios de pago aceptados en recepción */
    const METODOS_TAQUILLA = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'NEQUI'];
    const CANALES = ['WEB', 'PRESENCIAL', 'TELEFONICA'];

    class ReservaController {
        /**
         * @param {Object} deps Dependencias: reservaDAO, clienteDAO, pagoDAO, canchaController, disponibilidad,
         *   y opcionalmente promociones (HU05) y notificador (HU09)
         */
        constructor(deps) {
            this.deps = deps;
        }

        /**
         * Contrato: Calcula el valor de un turno antes de reservar
         * @param {Object} datos
         * @param {number} datos.canchaId
         * @param {string} datos.fecha
         * @param {number} datos.hora
         * @param {string} [datos.codigoPromocion] Cupón de descuento (HU05)
         * @param {string} [datos.telefono] Para aplicar el saldo a favor del cliente
         * @param {Date} [ahora=new Date()]
         * @returns {{cancha: Object, valorTarifa: number, descuento: number, valorTotal: number,
         *   anticipo: number, saldoAFavorAplicado: number, aPagarAhora: number, saldoEnCancha: number}}
         * @throws {Error} Si la franja no está disponible o el cupón no es válido
         */
        cotizar(datos, ahora = new Date()) {
            const hora = Number(datos.hora);
            const cancha = this.deps.disponibilidad.validarFranja(datos.canchaId, datos.fecha, hora, ahora);
            const valorTarifa = this.deps.canchaController.tarifaFranja(cancha, datos.fecha, hora);
            let descuento = 0;
            const codigo = String(datos.codigoPromocion || '').trim().toUpperCase();
            if (codigo) {
                if (!this.deps.promociones) {
                    throw new Error('Las promociones todavía no están habilitadas');
                }
                const promocion = this.deps.promociones.validar(codigo, datos.fecha, hora);
                descuento = this.deps.promociones.calcularDescuento(promocion, valorTarifa);
            }
            const valorTotal = valorTarifa - descuento;
            const anticipo = Math.round(valorTotal * PORCENTAJE_ANTICIPO);
            const cliente = datos.telefono ? this.deps.clienteDAO.buscarPorTelefono(datos.telefono) : null;
            const saldoAFavorAplicado = cliente ? Math.min(cliente.saldoAFavor, anticipo) : 0;
            return {
                cancha,
                valorTarifa,
                descuento,
                codigoPromocion: codigo,
                valorTotal,
                anticipo,
                saldoAFavorAplicado,
                aPagarAhora: anticipo - saldoAFavorAplicado,
                saldoEnCancha: valorTotal - anticipo
            };
        }

        /**
         * Contrato: Crea una reserva y cobra el anticipo (o el total) por la pasarela simulada
         * @param {Object} datos
         * @param {number} datos.canchaId
         * @param {string} datos.fecha 'AAAA-MM-DD'
         * @param {number} datos.hora
         * @param {string} datos.nombre Nombre del cliente
         * @param {string} datos.telefono Celular de 10 dígitos (inicia en 3)
         * @param {string} datos.metodoPago Ver METODOS_WEB / METODOS_TAQUILLA
         * @param {string} [datos.canal='WEB'] WEB, PRESENCIAL o TELEFONICA
         * @param {string} [datos.codigoPromocion]
         * @param {boolean} [datos.pagarTotal=false] Paga el 100 % en lugar del anticipo
         * @param {Date} [ahora=new Date()]
         * @returns {Reserva} Reserva confirmada
         * @throws {Error} Si los datos no son válidos o la franja ya no está disponible
         */
        crearReserva(datos, ahora = new Date()) {
            const canal = datos.canal || 'WEB';
            if (!CANALES.includes(canal)) {
                throw new Error(`El canal debe ser uno de: ${CANALES.join(', ')}`);
            }
            const { nombre, telefono } = this.validarCliente(datos.nombre, datos.telefono);
            this.validarMetodo(datos.metodoPago, canal === 'WEB' ? METODOS_WEB : METODOS_TAQUILLA);
            const cotizacion = this.cotizar({ ...datos, telefono }, ahora);
            const cliente = this.obtenerOCrearCliente(nombre, telefono);

            const montoObjetivo = datos.pagarTotal ? cotizacion.valorTotal : cotizacion.anticipo;
            const saldoAplicado = Math.min(cliente.saldoAFavor, montoObjetivo);
            const id = this.deps.reservaDAO.siguienteId();
            const reserva = new Reserva({
                id,
                codigo: `CG-${String(id).padStart(4, '0')}`,
                canchaId: cotizacion.cancha.id,
                fecha: datos.fecha,
                hora: Number(datos.hora),
                clienteNombre: nombre,
                clienteTelefono: telefono,
                canal,
                valorTarifa: cotizacion.valorTarifa,
                descuento: cotizacion.descuento,
                codigoPromocion: cotizacion.codigoPromocion,
                valorTotal: cotizacion.valorTotal,
                anticipo: cotizacion.anticipo,
                pagado: montoObjetivo,
                creadaEn: `${Fechas.hoy(ahora)} ${Fechas.horaActual(ahora)}`,
                historial: [`${Fechas.hoy(ahora)} ${Fechas.horaActual(ahora)} - Reserva confirmada (${canal})`]
            });

            if (saldoAplicado > 0) {
                this.deps.clienteDAO.actualizar(cliente.id, { saldoAFavor: cliente.saldoAFavor - saldoAplicado });
                this.registrarPago(reserva, Pago.TIPOS.SALDO_A_FAVOR, saldoAplicado, 'SALDO_A_FAVOR', ahora);
            }
            const cobro = montoObjetivo - saldoAplicado;
            if (cobro > 0) {
                const tipo = datos.pagarTotal ? Pago.TIPOS.TOTAL : Pago.TIPOS.ANTICIPO;
                this.registrarPago(reserva, tipo, cobro, datos.metodoPago, ahora);
            }
            this.deps.reservaDAO.guardar(reserva);
            if (cotizacion.codigoPromocion && this.deps.promociones) {
                this.deps.promociones.registrarUso(cotizacion.codigoPromocion);
            }
            this.notificar('CONFIRMACION', reserva, ahora);
            return reserva;
        }

        /**
         * Contrato: Registra un movimiento de caja asociado a una reserva
         * @param {Reserva} reserva
         * @param {string} tipo Uno de Pago.TIPOS
         * @param {number} monto
         * @param {string} metodo
         * @param {Date} [ahora=new Date()]
         * @returns {Pago}
         */
        registrarPago(reserva, tipo, monto, metodo, ahora = new Date()) {
            const id = this.deps.pagoDAO.siguienteId();
            return this.deps.pagoDAO.guardar(new Pago({
                id,
                reservaId: reserva.id,
                codigoReserva: reserva.codigo,
                tipo,
                monto,
                metodo,
                fecha: Fechas.hoy(ahora),
                hora: Fechas.horaActual(ahora),
                referencia: `TX-${String(id).padStart(5, '0')}`
            }));
        }

        /**
         * Contrato: Busca una reserva por su código
         * @param {string} codigo
         * @returns {Reserva}
         * @throws {Error} Si no existe
         */
        obtenerPorCodigo(codigo) {
            const reserva = this.deps.reservaDAO.buscarPorCodigo(codigo);
            if (!reserva) {
                throw new Error(`No existe una reserva con código ${String(codigo).toUpperCase()}`);
            }
            return reserva;
        }

        /**
         * Contrato: Retorna el cliente con ese teléfono o lo registra
         * @param {string} nombre
         * @param {string} telefono
         * @returns {Cliente}
         */
        obtenerOCrearCliente(nombre, telefono) {
            const existente = this.deps.clienteDAO.buscarPorTelefono(telefono);
            if (existente) {
                if (existente.nombre !== nombre) {
                    this.deps.clienteDAO.actualizar(existente.id, { nombre });
                }
                return existente;
            }
            return this.deps.clienteDAO.guardar(new Cliente(this.deps.clienteDAO.siguienteId(), nombre, telefono));
        }

        /**
         * Contrato: Valida nombre y teléfono del cliente
         * @param {string} nombre
         * @param {string} telefono
         * @returns {{nombre: string, telefono: string}} Datos normalizados
         * @throws {Error} Si algún dato no es válido
         */
        validarCliente(nombre, telefono) {
            const nombreLimpio = String(nombre || '').trim();
            const telefonoLimpio = String(telefono || '').replace(/\s/g, '');
            if (nombreLimpio.length < 3) {
                throw new Error('El nombre del cliente debe tener al menos 3 caracteres');
            }
            if (!/^3\d{9}$/.test(telefonoLimpio)) {
                throw new Error('El teléfono debe ser un celular de 10 dígitos que inicie en 3');
            }
            return { nombre: nombreLimpio, telefono: telefonoLimpio };
        }

        /**
         * Contrato: Valida el medio de pago
         * @param {string} metodo
         * @param {Array<string>} permitidos
         * @throws {Error} Si el medio de pago no está permitido
         */
        validarMetodo(metodo, permitidos) {
            if (!permitidos.includes(metodo)) {
                throw new Error(`El medio de pago debe ser uno de: ${permitidos.join(', ')}`);
            }
        }

        /**
         * Contrato: Envía una notificación si el módulo de notificaciones (HU09) está instalado
         * @param {string} tipo
         * @param {Reserva} reserva
         * @param {Date} ahora
         * @param {string} [detalle]
         */
        notificar(tipo, reserva, ahora, detalle = '') {
            if (this.deps.notificador) {
                this.deps.notificador.notificar(tipo, reserva, detalle, ahora);
            }
        }
    }

    ReservaController.PORCENTAJE_ANTICIPO = PORCENTAJE_ANTICIPO;
    ReservaController.METODOS_WEB = METODOS_WEB;
    ReservaController.METODOS_TAQUILLA = METODOS_TAQUILLA;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ReservaController;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).ReservaController = ReservaController;
    }
})(typeof window !== 'undefined' ? window : globalThis);
