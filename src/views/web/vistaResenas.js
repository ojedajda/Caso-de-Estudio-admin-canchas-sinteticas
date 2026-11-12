/**
 * Vista web - HU11 Calificación y Reseña del Servicio de la Cancha
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'resenas',
        hu: 'HU11',
        titulo: 'Calificar servicio',
        grupo: 'Cliente',
        orden: 5,
        render(el, sistema) {
            const { UI } = CG;
            const estrellas = (n) => `<span class="estrellas">${'★'.repeat(Math.round(n))}${'☆'.repeat(5 - Math.round(n))}</span>`;
            el.innerHTML = `
                <div class="titulo-vista">
                    <div><h2>Calificación y reseñas</h2>
                    <p class="muted">Califica de 1 a 5 estrellas los partidos que ya jugaste.</p></div>
                </div>
                <div class="rejilla rejilla-2">
                    <div>
                        <div class="tarjeta">
                            <form id="buscar" class="fila-botones">
                                <label>Celular <input name="telefono" required pattern="3[0-9]{9}" placeholder="3001234567"></label>
                                <button class="btn btn-primario" type="submit">Ver partidos por calificar</button>
                            </form>
                        </div>
                        <div id="pendientes"></div>
                    </div>
                    <div>
                        <div class="tarjeta"><h3>Promedio por cancha</h3><div id="promedios"></div></div>
                        <div class="tarjeta"><h3>Reseñas recientes</h3><div id="recientes"></div></div>
                    </div>
                </div>`;
            const form = el.querySelector('#buscar');
            const pendientes = el.querySelector('#pendientes');

            const pintarResumen = () => {
                el.querySelector('#promedios').innerHTML = `<table><tr><th>Cancha</th><th>Promedio</th><th class="num">Reseñas</th></tr>
                    ${sistema.resenas.promedios().map((p) => `<tr><td>${UI.esc(p.cancha)}</td><td>${p.total ? `${estrellas(p.promedio)} ${p.promedio}` : '<small>Sin calificaciones</small>'}</td><td class="num">${p.total}</td></tr>`).join('')}</table>`;
                const recientes = sistema.resenas.recientes();
                el.querySelector('#recientes').innerHTML = recientes.length ? recientes.map((r) => `<div class="mensaje" style="border-left-color:#f59e0b;background:#fffbeb">
                    <header><span>${UI.esc(r.cliente)} · ${UI.esc(UI.nombreCancha(sistema, r.canchaId))}</span><span>${r.fecha}</span></header>
                    ${estrellas(r.calificacion)} ${UI.esc(r.comentario)}</div>`).join('') : UI.vacio('Aún no hay reseñas.');
            };
            const pintarPendientes = () => {
                const lista = sistema.resenas.pendientesPorCalificar(form.telefono.value.trim());
                pendientes.innerHTML = `<div class="tarjeta"><h3>Partidos por calificar</h3>${lista.length ? lista.map((r) => `
                    <form class="calificar" data-codigo="${r.codigo}" style="border-top:1px solid var(--borde);padding-top:.8rem;margin-top:.8rem">
                        <p><b>${r.codigo}</b> · ${UI.esc(UI.nombreCancha(sistema, r.canchaId))} · ${r.fecha} ${UI.hora(r.hora)}</p>
                        <div class="campos">
                            <label>Calificación <select name="calificacion">${UI.opciones([[5, '★★★★★ Excelente'], [4, '★★★★ Muy bueno'], [3, '★★★ Bueno'], [2, '★★ Regular'], [1, '★ Malo']], 5)}</select></label>
                            <label>Comentario <textarea name="comentario" maxlength="300" placeholder="¿Cómo estuvo la grama, la iluminación, la atención?"></textarea></label>
                        </div>
                        <button class="btn btn-primario btn-chico" type="submit">Enviar reseña</button>
                    </form>`).join('') : UI.vacio('No tienes partidos pendientes por calificar.')}</div>`;
            };

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                pintarPendientes();
            });
            pendientes.addEventListener('submit', (e) => {
                e.preventDefault();
                const f = e.target;
                if (UI.intentar(() => sistema.resenas.calificar(f.dataset.codigo, Number(f.calificacion.value), f.comentario.value), '¡Gracias por tu reseña!')) {
                    pintarPendientes();
                    pintarResumen();
                }
            });
            pintarResumen();
        }
    });
})(window);
