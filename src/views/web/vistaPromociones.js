/**
 * Vista web - HU05 Creación de Promociones y Descuentos
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'promociones',
        hu: 'HU05',
        titulo: 'Promociones',
        grupo: 'Administración',
        orden: 9,
        render(el, sistema) {
            const { UI, Fechas } = CG;
            el.innerHTML = `
                <div class="titulo-vista">
                    <div><h2>Promociones y descuentos</h2>
                    <p class="muted">Cupones para incentivar reservas en horas de baja demanda. El cliente los escribe al reservar.</p></div>
                </div>
                <div class="tarjeta">
                    <h3>Nuevo cupón</h3>
                    <form id="nuevo">
                        <div class="campos">
                            <label>Código <input name="codigo" required placeholder="MANANERO20" style="text-transform:uppercase"></label>
                            <label>Descripción <input name="descripcion" placeholder="20 % en las mañanas"></label>
                            <label>Tipo <select name="tipo">${UI.opciones([['PORCENTAJE', 'Porcentaje (%)'], ['MONTO', 'Monto fijo ($)']], 'PORCENTAJE')}</select></label>
                            <label>Valor <input type="number" name="valor" min="1" required></label>
                            <label>Desde <input type="date" name="fechaInicio" value="${Fechas.hoy()}" required></label>
                            <label>Hasta <input type="date" name="fechaFin" value="${Fechas.sumarDias(Fechas.hoy(), 30)}" required></label>
                        </div>
                        <label class="check"><input type="checkbox" name="soloHorarioValle"> Solo horario valle (lunes a sábado antes de las 18:00)</label>
                        <p><button class="btn btn-primario" type="submit">Crear cupón</button></p>
                    </form>
                </div>
                <div class="tarjeta"><h3>Cupones</h3><div class="tabla-contenedor" id="tabla"></div></div>`;
            const tabla = el.querySelector('#tabla');

            const pintar = () => {
                const promos = sistema.promociones.listar();
                tabla.innerHTML = promos.length ? `<table><tr><th>Código</th><th>Descuento</th><th>Vigencia</th><th>Condición</th><th class="num">Usos</th><th>Estado</th></tr>
                    ${promos.map((p) => `<tr data-id="${p.id}"><td><b>${UI.esc(p.codigo)}</b><br><small>${UI.esc(p.descripcion)}</small></td>
                        <td>${p.tipo === 'PORCENTAJE' ? `${p.valor} %` : UI.cop(p.valor)}</td><td>${p.fechaInicio} al ${p.fechaFin}</td>
                        <td>${p.soloHorarioValle ? 'Horario valle' : 'Cualquier horario'}</td><td class="num">${p.usos}</td>
                        <td><label class="check"><input type="checkbox" ${p.activa ? 'checked' : ''}> ${p.activa ? 'Activo' : 'Inactivo'}</label></td></tr>`).join('')}</table>`
                    : UI.vacio('Aún no hay cupones.');
            };

            el.querySelector('#nuevo').addEventListener('submit', (e) => {
                e.preventDefault();
                const datos = { ...UI.datos(e.target), soloHorarioValle: e.target.soloHorarioValle.checked };
                if (UI.intentar(() => sistema.promociones.crear(datos), 'Cupón creado')) {
                    e.target.codigo.value = '';
                    e.target.descripcion.value = '';
                    e.target.valor.value = '';
                    pintar();
                }
            });
            tabla.addEventListener('change', (e) => {
                const id = Number(e.target.closest('tr').dataset.id);
                UI.intentar(() => sistema.promociones.cambiarEstado(id, e.target.checked), e.target.checked ? 'Cupón activado' : 'Cupón desactivado');
                pintar();
            });
            pintar();
        }
    });
})(window);
