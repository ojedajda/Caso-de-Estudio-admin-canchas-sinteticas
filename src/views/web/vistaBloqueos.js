/**
 * Vista web - HU12 Bloqueo de Emergencia por Mantenimiento o Imprevistos
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'bloqueos',
        hu: 'HU12',
        titulo: 'Bloqueos de emergencia',
        grupo: 'Administración',
        orden: 10,
        render(el, sistema) {
            const { UI, Fechas } = CG;
            const horas = Fechas.franjasDelDia();
            const finales = horas.map((h) => h + 1);
            el.innerHTML = `
                <div class="titulo-vista">
                    <div><h2>Bloqueo de emergencia</h2>
                    <p class="muted">Inhabilita una cancha por lluvia, reparaciones u otro imprevisto. Las reservas afectadas se cancelan,
                    el valor pagado pasa a saldo a favor y se notifica a los clientes.</p></div>
                </div>
                <div class="tarjeta">
                    <form id="nuevo">
                        <div class="campos">
                            <label>Cancha <select name="canchaId">${UI.opcionesCanchas(sistema, null, false)}</select></label>
                            <label>Fecha <input type="date" name="fecha" min="${Fechas.hoy()}" value="${Fechas.hoy()}" required></label>
                            <label>Desde <select name="horaInicio">${UI.opcionesHoras(horas, 18)}</select></label>
                            <label>Hasta <select name="horaFin">${UI.opcionesHoras(finales, 22)}</select></label>
                            <label>Motivo <input name="motivo" required minlength="4" placeholder="Lluvia fuerte / reparación de luminarias"></label>
                        </div>
                        <button class="btn btn-peligro" type="submit">Bloquear franja</button>
                    </form>
                    <div id="resultado"></div>
                </div>
                <div class="tarjeta"><h3>Bloqueos vigentes</h3><div class="tabla-contenedor" id="tabla"></div></div>`;
            const tabla = el.querySelector('#tabla');

            const pintar = () => {
                const bloqueos = sistema.bloqueos.listar();
                tabla.innerHTML = bloqueos.length ? `<table><tr><th>Cancha</th><th>Fecha</th><th>Horario</th><th>Motivo</th><th></th></tr>
                    ${bloqueos.map((b) => `<tr><td>${UI.esc(UI.nombreCancha(sistema, b.canchaId))}</td><td>${Fechas.nombreDia(b.fecha)} ${b.fecha}</td>
                        <td>${UI.hora(b.horaInicio)} - ${UI.hora(b.horaFin)}</td><td>${UI.esc(b.motivo)}</td>
                        <td><button class="btn btn-chico" data-levantar="${b.id}">Levantar</button></td></tr>`).join('')}</table>`
                    : UI.vacio('No hay bloqueos vigentes.');
            };

            el.querySelector('#nuevo').addEventListener('submit', (e) => {
                e.preventDefault();
                const resultado = UI.intentar(() => sistema.bloqueos.bloquear(UI.datos(e.target)), 'Franja bloqueada');
                if (resultado) {
                    el.querySelector('#resultado').innerHTML = resultado.afectadas.length
                        ? `<div class="aviso">Se cancelaron ${resultado.afectadas.length} reserva(s): ${resultado.afectadas.map((r) => `${r.codigo} (${UI.esc(r.clienteNombre)})`).join(', ')}.
                            El valor pagado quedó como saldo a favor${sistema.notificaciones ? ' y se notificó por WhatsApp' : ''}.</div>`
                        : '<div class="aviso">No había reservas en esa franja.</div>';
                    e.target.motivo.value = '';
                    pintar();
                }
            });
            tabla.addEventListener('click', (e) => {
                const boton = e.target.closest('[data-levantar]');
                if (boton && UI.intentar(() => sistema.bloqueos.levantar(Number(boton.dataset.levantar)), 'Bloqueo levantado')) {
                    pintar();
                }
            });
            pintar();
        }
    });
})(window);
