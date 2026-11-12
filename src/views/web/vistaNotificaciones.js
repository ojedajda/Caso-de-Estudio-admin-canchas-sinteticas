/**
 * Vista web - HU09 Notificaciones Automáticas de Confirmación y Recordatorio
 * Bandeja de salida que simula los mensajes enviados por WhatsApp Business API.
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'notificaciones',
        hu: 'HU09',
        titulo: 'Notificaciones',
        grupo: 'Administración',
        orden: 12,
        render(el, sistema) {
            const { UI } = CG;
            const iconos = { CONFIRMACION: '✅', RECORDATORIO: '⏰', CANCELACION: '❌', REAGENDAMIENTO: '🔁', BLOQUEO: '⚠️' };
            el.innerHTML = `
                <div class="titulo-vista">
                    <div><h2>Notificaciones automáticas</h2>
                    <p class="muted">Mensajes de WhatsApp enviados a los clientes (integración simulada). Los recordatorios salen
                    ${CG.NotificacionController.HORAS_RECORDATORIO} h antes del turno.</p></div>
                    <div class="fila-botones">
                        <button class="btn btn-primario" id="recordatorios">Enviar recordatorios pendientes</button>
                    </div>
                </div>
                <div class="tarjeta">
                    <form id="filtro" class="fila-botones">
                        <label>Filtrar por celular <input name="telefono" placeholder="Todos"></label>
                        <button class="btn" type="submit">Filtrar</button>
                    </form>
                </div>
                <div class="tarjeta" id="bandeja"></div>`;
            const form = el.querySelector('#filtro');

            const pintar = () => {
                const lista = sistema.notificaciones.listar(form.telefono.value.trim() || undefined);
                el.querySelector('#bandeja').innerHTML = `<h3>Bandeja de salida (${lista.length})</h3>` + (lista.length
                    ? lista.map((n) => `<div class="mensaje"><header><span>${iconos[n.tipo] || ''} ${n.tipo} · WhatsApp → ${UI.esc(n.destinatario)}</span>
                        <span>${n.fecha} ${n.hora}</span></header>${UI.esc(n.mensaje)}</div>`).join('')
                    : UI.vacio('No hay notificaciones enviadas.'));
            };

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                pintar();
            });
            el.querySelector('#recordatorios').addEventListener('click', () => {
                const enviados = sistema.notificaciones.generarRecordatorios();
                UI.toast(enviados.length ? `Se enviaron ${enviados.length} recordatorio(s)` : 'No hay recordatorios pendientes en las próximas 24 h');
                pintar();
            });
            pintar();
        }
    });
})(window);
