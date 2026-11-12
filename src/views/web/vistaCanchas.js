/**
 * Vista web - HU04 Configuración de Canchas y Tarifas Dinámicas
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'canchas',
        hu: 'HU04',
        titulo: 'Canchas y tarifas',
        grupo: 'Administración',
        orden: 8,
        render(el, sistema) {
            const { UI } = CG;
            const pico = `${UI.hora(CG.CanchaController.HORA_PICO_INICIO)} a ${UI.hora(CG.CanchaController.HORA_PICO_FIN)}`;
            el.innerHTML = `
                <div class="titulo-vista">
                    <div><h2>Configuración de canchas y tarifas dinámicas</h2>
                    <p class="muted">Tarifa de festivo para domingos y festivos · tarifa de hora pico de ${pico} · tarifa base el resto del día.</p></div>
                </div>
                <div class="tarjeta"><div class="tabla-contenedor" id="tabla"></div></div>
                <div class="tarjeta">
                    <h3>Agregar cancha</h3>
                    <form id="nueva">
                        <div class="campos">
                            <label>Nombre <input name="nombre" required placeholder="Cancha 4"></label>
                            <label>Tipo <select name="tipo">${UI.opciones(CG.CanchaController.TIPOS.map((t) => [t, t]), 'Fútbol 5')}</select></label>
                            <label>Tarifa base <input type="number" name="tarifaBase" min="1000" step="1000" required></label>
                            <label>Tarifa hora pico <input type="number" name="tarifaHoraPico" min="1000" step="1000" required></label>
                            <label>Tarifa festivo <input type="number" name="tarifaFestivo" min="1000" step="1000" required></label>
                        </div>
                        <button class="btn btn-primario" type="submit">Agregar cancha</button>
                    </form>
                </div>`;
            const tabla = el.querySelector('#tabla');

            const pintar = () => {
                tabla.innerHTML = `<table><tr><th>Cancha</th><th>Tipo</th><th>Base</th><th>Hora pico</th><th>Festivo</th><th>Estado</th><th></th></tr>
                    ${sistema.canchas.listarCanchas().map((c) => `<tr data-id="${c.id}">
                        <td><b>${UI.esc(c.nombre)}</b></td><td>${UI.esc(c.tipo)}</td>
                        <td><input type="number" name="tarifaBase" value="${c.tarifaBase}" step="1000" style="width:110px"></td>
                        <td><input type="number" name="tarifaHoraPico" value="${c.tarifaHoraPico}" step="1000" style="width:110px"></td>
                        <td><input type="number" name="tarifaFestivo" value="${c.tarifaFestivo}" step="1000" style="width:110px"></td>
                        <td><label class="check"><input type="checkbox" name="habilitada" ${c.habilitada ? 'checked' : ''}> ${c.habilitada ? 'Habilitada' : 'Inhabilitada'}</label></td>
                        <td><button class="btn btn-chico" data-guardar>Guardar tarifas</button></td></tr>`).join('')}</table>`;
            };

            tabla.addEventListener('click', (e) => {
                if (!e.target.closest('[data-guardar]')) {
                    return;
                }
                const fila = e.target.closest('tr');
                const valor = (nombre) => Number(fila.querySelector(`[name="${nombre}"]`).value);
                if (UI.intentar(() => sistema.canchas.actualizarTarifas(Number(fila.dataset.id), valor('tarifaBase'), valor('tarifaHoraPico'), valor('tarifaFestivo')), 'Tarifas actualizadas')) {
                    pintar();
                }
            });
            tabla.addEventListener('change', (e) => {
                if (e.target.name === 'habilitada') {
                    const id = Number(e.target.closest('tr').dataset.id);
                    UI.intentar(() => sistema.canchas.cambiarEstado(id, e.target.checked), e.target.checked ? 'Cancha habilitada para la venta' : 'Cancha inhabilitada para la venta');
                    pintar();
                }
            });
            el.querySelector('#nueva').addEventListener('submit', (e) => {
                e.preventDefault();
                const d = UI.datos(e.target);
                if (UI.intentar(() => sistema.canchas.registrarCancha(d.nombre, d.tipo, d.tarifaBase, d.tarifaHoraPico, d.tarifaFestivo), 'Cancha agregada')) {
                    e.target.reset();
                    pintar();
                }
            });
            pintar();
        }
    });
})(window);
