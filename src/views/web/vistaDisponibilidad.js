/**
 * Vista web - HU01 Consulta de Disponibilidad de Canchas
 * Agenda en tiempo real: canchas (filas) por franjas horarias (columnas).
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'disponibilidad',
        hu: 'HU01',
        titulo: 'Disponibilidad',
        grupo: 'Cliente',
        orden: 1,
        render(el, sistema, params, app) {
            const { UI, Fechas } = CG;
            const tipos = CG.CanchaController.TIPOS.map((t) => [t, t]);
            el.innerHTML = `
                <div class="titulo-vista">
                    <div><h2>Consulta de disponibilidad</h2>
                    <p class="muted">Estado de cada cancha por franja horaria. Haz clic en una franja libre para reservarla.</p></div>
                </div>
                <div class="tarjeta">
                    <form id="filtros" class="fila-botones">
                        <label>Fecha <input type="date" name="fecha" value="${params.fecha || Fechas.hoy()}" required></label>
                        <label>Tipo de cancha <select name="tipo"><option value="">Todas</option>${UI.opciones(tipos, '')}</select></label>
                    </form>
                    <div id="resumen" class="rejilla rejilla-4" style="margin:1rem 0"></div>
                    <div class="tabla-contenedor"><table class="agenda" id="agenda"></table></div>
                    <div class="leyenda"><span class="l-libre">Libre</span><span class="l-pico">Libre (hora pico)</span>
                        <span class="l-reservada">Reservada</span><span class="l-bloqueada">Bloqueada</span><span class="l-pasada">No disponible</span></div>
                </div>`;
            const form = el.querySelector('#filtros');
            const agenda = el.querySelector('#agenda');

            const pintar = () => {
                const datos = UI.intentar(() => sistema.disponibilidad.consultar(form.fecha.value, { tipo: form.tipo.value }));
                if (!datos) {
                    return;
                }
                const resumen = sistema.disponibilidad.resumen(form.fecha.value);
                el.querySelector('#resumen').innerHTML = `
                    <div class="kpi"><small>Franjas libres</small><b>${resumen.libres}</b></div>
                    <div class="kpi"><small>Reservadas</small><b>${resumen.reservadas}</b></div>
                    <div class="kpi"><small>Bloqueadas</small><b>${resumen.bloqueadas}</b></div>
                    <div class="kpi"><small>Ocupación del día</small><b>${resumen.ocupacion} %</b></div>`;
                const horas = Fechas.franjasDelDia();
                const textos = { RESERVADA: 'Ocupada', BLOQUEADA: 'Bloq.', PASADA: '—', INHABILITADA: '—' };
                agenda.innerHTML = `<tr><th class="cancha">${Fechas.nombreDia(form.fecha.value)} ${form.fecha.value}</th>${horas.map((h) => `<th>${UI.hora(h)}</th>`).join('')}</tr>`
                    + datos.map(({ cancha, franjas }) => `<tr><th class="cancha">${UI.esc(cancha.nombre)}<br><small>${UI.esc(cancha.tipo)}${cancha.habilitada ? '' : ' · inhabilitada'}</small></th>`
                        + franjas.map((f) => {
                            const titulo = f.estado === 'BLOQUEADA' ? f.motivo : f.estado === 'LIBRE' ? `Reservar ${UI.cop(f.tarifa)}` : f.estado;
                            const texto = f.estado === 'LIBRE' ? `$${Math.round(f.tarifa / 1000)}k` : textos[f.estado];
                            const datosFranja = f.estado === 'LIBRE' ? `data-cancha="${cancha.id}" data-hora="${f.hora}"` : '';
                            return `<td><span class="franja franja-${f.estado} ${f.horaPico ? 'pico' : ''}" title="${UI.esc(titulo)}" ${datosFranja}>${texto}</span></td>`;
                        }).join('') + '</tr>').join('');
            };

            form.addEventListener('change', pintar);
            agenda.addEventListener('click', (e) => {
                const franja = e.target.closest('[data-hora]');
                if (!franja) {
                    return;
                }
                if (CG.vistas.some((v) => v.id === 'reservar')) {
                    app.ir('reservar', { canchaId: franja.dataset.cancha, fecha: form.fecha.value, hora: franja.dataset.hora });
                } else {
                    UI.toast('La reserva en línea se habilita con la HU02');
                }
            });
            pintar();
        }
    });
})(window);
