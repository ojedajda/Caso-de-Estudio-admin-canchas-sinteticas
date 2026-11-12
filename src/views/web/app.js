/**
 * Capa de Presentación web de CanchaGO (HU01 - arquitectura base).
 * Arma el menú con las vistas registradas por cada historia de usuario y solo se
 * comunica con la lógica de negocio a través de las fachadas creadas por crearSistema().
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO = global.CanchaGO || {};
    CG.vistas = CG.vistas || [];
    const GRUPOS = ['Cliente', 'Recepción', 'Administración'];

    /** Utilidades de interfaz compartidas por todas las vistas */
    const UI = {
        /** @param {number} n @returns {string} Valor en pesos colombianos */
        cop(n) {
            return `$ ${Math.round(Number(n) || 0).toLocaleString('es-CO')}`;
        },
        /** Escapa texto para insertarlo en HTML de forma segura */
        esc(texto) {
            const mapa = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
            return String(texto ?? '').replace(/[&<>"']/g, (c) => mapa[c]);
        },
        hora(h) {
            return CG.Fechas.formatoHora(h);
        },
        estado(estado) {
            const textos = { CONFIRMADA: 'Confirmada', INGRESADA: 'Jugada', CANCELADA: 'Cancelada', CANCELADA_BLOQUEO: 'Cancelada por bloqueo' };
            return `<span class="estado estado-${UI.esc(estado)}">${textos[estado] || UI.esc(estado)}</span>`;
        },
        /** Muestra un mensaje emergente */
        toast(mensaje, tipo = 'ok') {
            const zona = document.getElementById('toast');
            const div = document.createElement('div');
            div.className = `toast ${tipo === 'error' ? 'error' : ''}`;
            div.textContent = mensaje;
            zona.appendChild(div);
            setTimeout(() => div.remove(), tipo === 'error' ? 5000 : 3500);
        },
        /** Ejecuta una acción y muestra el error de negocio como mensaje (no rompe la página) */
        intentar(accion, mensajeExito) {
            try {
                const resultado = accion();
                if (mensajeExito) {
                    UI.toast(mensajeExito);
                }
                return resultado === undefined ? true : resultado;
            } catch (error) {
                UI.toast(error.message, 'error');
                return null;
            }
        },
        /** @param {Array<[string, string]>} lista Pares [valor, texto] */
        opciones(lista, seleccion) {
            return lista.map(([valor, texto]) => `<option value="${UI.esc(valor)}" ${String(valor) === String(seleccion) ? 'selected' : ''}>${UI.esc(texto)}</option>`).join('');
        },
        opcionesCanchas(sistema, seleccion, soloHabilitadas = true) {
            const canchas = soloHabilitadas ? sistema.canchas.listarCanchasHabilitadas() : sistema.canchas.listarCanchas();
            return UI.opciones(canchas.map((c) => [c.id, `${c.nombre} · ${c.tipo}`]), seleccion);
        },
        opcionesHoras(horas, seleccion) {
            return horas.length
                ? UI.opciones(horas.map((h) => [h, UI.hora(h)]), seleccion)
                : '<option value="">Sin cupos</option>';
        },
        nombreCancha(sistema, id) {
            const cancha = sistema.daos.canchaDAO.buscarPorId(id);
            return cancha ? cancha.nombre : `Cancha ${id}`;
        },
        /** Datos de un formulario como objeto */
        datos(form) {
            return Object.fromEntries(new FormData(form).entries());
        },
        /** Descarga un texto como archivo */
        descargar(nombre, contenido, tipo = 'text/csv;charset=utf-8') {
            const blob = new Blob(['﻿', contenido], { type: tipo });
            const enlace = document.createElement('a');
            enlace.href = URL.createObjectURL(blob);
            enlace.download = nombre;
            enlace.click();
            URL.revokeObjectURL(enlace.href);
        },
        vacio(texto) {
            return `<div class="vacio">${UI.esc(texto)}</div>`;
        }
    };

    /** Aplicación de una sola página */
    const App = {
        sistema: null,
        almacen: null,
        params: {},

        iniciar() {
            this.almacen = new CG.Almacen('canchago');
            this.sistema = this.crearSistemaConSesion();
            CG.vistas.sort((a, b) => a.orden - b.orden);
            document.getElementById('menu').addEventListener('click', (e) => {
                const boton = e.target.closest('[data-vista]');
                if (boton) {
                    this.ir(boton.dataset.vista);
                }
            });
            document.getElementById('btn-demo').addEventListener('click', () => this.cargarDemo());
            document.getElementById('btn-reiniciar').addEventListener('click', () => this.reiniciar());
            document.getElementById('sesion').addEventListener('click', (e) => {
                const boton = e.target.closest('[data-sesion]');
                if (boton) {
                    boton.dataset.sesion === 'salir' ? this.cerrarSesion() : this.ir('login');
                }
            });
            global.addEventListener('hashchange', () => this.render());
            this.render();
        },

        /** Crea el sistema y le conecta la sesión guardada en esta pestaña (se borra al cerrarla) */
        crearSistemaConSesion() {
            const sistema = CG.crearSistema(this.almacen);
            const LLAVE = 'canchago:sesion';
            sistema.auth.usarAlmacenSesion({
                leer() {
                    try {
                        return JSON.parse(global.sessionStorage.getItem(LLAVE));
                    } catch (error) {
                        return null;
                    }
                },
                guardar(estado) {
                    try {
                        global.sessionStorage.setItem(LLAVE, JSON.stringify(estado));
                    } catch (error) {
                        // Sin sessionStorage la sesión dura solo mientras la página siga abierta
                    }
                }
            });
            return sistema;
        },

        /** Menú lateral: solo los grupos que el rol actual puede usar */
        pintarMenu() {
            const auth = this.sistema.auth;
            document.getElementById('menu').innerHTML = GRUPOS.filter((grupo) => auth.puedeVerGrupo(grupo)).map((grupo) => {
                const vistas = CG.vistas.filter((v) => v.grupo === grupo);
                if (!vistas.length) {
                    return '';
                }
                return `<h4>${grupo}</h4>${vistas.map((v) => `<button data-vista="${v.id}">${UI.esc(v.titulo)}<span class="etiqueta-hu">${v.hu}</span></button>`).join('')}`;
            }).join('');
        },

        /** Parte derecha de la barra: quién está conectado y las acciones solo para administración */
        pintarSesion() {
            const auth = this.sistema.auth;
            const sesion = auth.sesionActual();
            document.getElementById('sesion').innerHTML = sesion
                ? `<span class="sesion-nombre">${UI.esc(sesion.nombre)}</span>
                   <button class="btn btn-chico" type="button" data-sesion="salir">Cerrar sesión</button>`
                : '<button class="btn btn-primario btn-chico" type="button" data-sesion="entrar">Iniciar sesión</button>';
            document.getElementById('acciones-admin').hidden = !auth.esAdministrador();
        },

        /** Tras iniciar sesión lleva a la sección que la persona quería abrir */
        alIniciarSesion(sesion) {
            UI.toast(`Bienvenido, ${sesion.nombre}`);
            const pendiente = CG.vistas.find((v) => v.id === this.destinoPendiente);
            // Solo vuelve a la sección pedida si este rol la puede usar; si no, a la disponibilidad
            const destino = pendiente && this.sistema.auth.puedeVerGrupo(pendiente.grupo) ? pendiente.id : 'disponibilidad';
            this.destinoPendiente = null;
            this.ir(destino);
        },

        cerrarSesion() {
            this.sistema.auth.cerrarSesion();
            this.destinoPendiente = null;
            UI.toast('Sesión cerrada');
            this.ir('disponibilidad');
        },

        /** Navega a una vista, opcionalmente con parámetros (ej: franja elegida en la disponibilidad) */
        ir(id, params = {}) {
            this.params = params;
            if (global.location.hash.slice(1) === id) {
                this.render();
            } else {
                global.location.hash = id;
            }
        },

        render() {
            const id = global.location.hash.slice(1);
            let vista = CG.vistas.find((v) => v.id === id) || CG.vistas[0];
            let params = this.params;
            this.params = {};
            // Control de acceso: aunque se escriba la dirección a mano, sin permiso solo se ve el inicio de sesión
            if (GRUPOS.includes(vista.grupo) && !this.sistema.auth.puedeVerGrupo(vista.grupo)) {
                this.destinoPendiente = vista.id;
                params = { requerido: vista.grupo };
                vista = CG.vistas.find((v) => v.id === 'login');
            }
            this.pintarMenu();
            this.pintarSesion();
            document.querySelectorAll('#menu [data-vista]').forEach((b) => b.classList.toggle('activo', b.dataset.vista === vista.id));
            const principal = document.getElementById('principal');
            principal.innerHTML = '';
            vista.render(principal, this.sistema, params, this);
            global.scrollTo(0, 0);
        },

        reiniciar() {
            if (!this.sistema.auth.esAdministrador()) {
                UI.toast('Solo el administrador puede reiniciar los datos.', 'error');
                return;
            }
            this.almacen.limpiar();
            this.sistema = this.crearSistemaConSesion();
            this.render();
            UI.toast('Se borraron los datos. El sistema quedó como recién instalado.');
        },

        /** Carga datos de demostración usando las mismas fachadas que usa el usuario */
        cargarDemo() {
            const s = this.sistema;
            const F = CG.Fechas;
            if (!s.auth.esAdministrador()) {
                UI.toast('Solo el administrador puede cargar los datos de demostración.', 'error');
                return;
            }
            if (s.daos.reservaDAO && s.daos.reservaDAO.obtenerTodas().length) {
                UI.toast('Ya hay reservas registradas. Usa "Reiniciar datos" antes de cargar la demostración.', 'error');
                return;
            }
            const hoy = F.hoy();
            const intentar = (accion) => {
                try {
                    return accion();
                } catch (error) {
                    return null;
                }
            };
            if (s.promociones && !s.daos.promocionDAO.buscarPorCodigo('MANANERO20')) {
                s.promociones.crear({ codigo: 'MANANERO20', descripcion: '20 % de descuento en horario valle', tipo: 'PORCENTAJE', valor: 20,
                    fechaInicio: F.sumarDias(hoy, -30), fechaFin: F.sumarDias(hoy, 30), soloHorarioValle: true });
                s.promociones.crear({ codigo: 'BIENVENIDA', descripcion: '$10.000 en tu primera reserva', tipo: 'MONTO', valor: 10000,
                    fechaInicio: hoy, fechaFin: F.sumarDias(hoy, 60) });
            }
            if (s.reservas) {
                const equipo = [['Jesús Ojeda', '3001234567'], ['Samuel Betancourt', '3109876543'], ['Luisa Salazar', '3157778888'], ['Karol Estefany Herrera', '3204445566']];
                // Historial: Jesús juega los viernes a las 19:00 en la Cancha 1 (últimas 3 semanas)
                for (let semana = 3; semana >= 1; semana--) {
                    let dia = F.sumarDias(hoy, -7 * semana);
                    while (F.aDate(dia).getDay() !== 5) {
                        dia = F.sumarDias(dia, 1);
                    }
                    const r = intentar(() => s.reservas.crearReserva({ canchaId: 1, fecha: dia, hora: 19, nombre: equipo[0][0], telefono: equipo[0][1], metodoPago: 'NEQUI' }, F.aDate(F.sumarDias(dia, -2), 10)));
                    if (r && s.acceso) {
                        intentar(() => s.acceso.registrarIngreso(r.codigo, 'EFECTIVO', F.aDate(dia, 18)));
                        if (s.resenas) {
                            intentar(() => s.resenas.calificar(r.codigo, semana === 2 ? 4 : 5, semana === 2 ? 'Buena cancha, faltó iluminación en un costado' : 'Excelente grama y atención', F.aDate(dia, 21)));
                        }
                    }
                }
                // Reservas de hoy y de los próximos días
                [0, 0, 1, 1, 2, 3].forEach((dias, i) => {
                    const fecha = F.sumarDias(hoy, dias);
                    const [nombre, telefono] = equipo[i % equipo.length];
                    const canchaId = (i % 3) + 1;
                    const libres = intentar(() => s.disponibilidad.horasLibres(canchaId, fecha)) || [];
                    const hora = libres[Math.min(libres.length - 1, 2 + i)];
                    if (hora !== undefined) {
                        const r = intentar(() => s.reservas.crearReserva({ canchaId, fecha, hora, nombre, telefono, metodoPago: ['NEQUI', 'PSE', 'TARJETA'][i % 3] }));
                        if (r && dias === 0 && i === 0 && s.acceso) {
                            intentar(() => s.acceso.registrarIngreso(r.codigo, 'EFECTIVO'));
                        }
                    }
                });
                if (s.taquilla) {
                    const fecha = F.sumarDias(hoy, 1);
                    const libres = intentar(() => s.disponibilidad.horasLibres(2, fecha)) || [];
                    if (libres.length) {
                        intentar(() => s.taquilla.registrar({ canchaId: 2, fecha, hora: libres[libres.length - 1], nombre: 'Club Deportivo Pasto', telefono: '3011112222', canal: 'TELEFONICA', metodoPago: 'TRANSFERENCIA' }));
                    }
                }
            }
            if (s.bloqueos) {
                intentar(() => s.bloqueos.bloquear({ canchaId: 3, fecha: F.sumarDias(hoy, 1), horaInicio: 8, horaFin: 10, motivo: 'Mantenimiento de la grama sintética' }));
            }
            if (s.notificaciones) {
                s.notificaciones.generarRecordatorios();
            }
            this.render();
            UI.toast('Datos de demostración cargados.');
        }
    };

    CG.UI = UI;
    CG.App = App;
    document.addEventListener('DOMContentLoaded', () => App.iniciar());
})(window);
