/**
 * Vista web - Inicio de sesión del personal (Issue #29)
 * No aparece en el menú: se abre desde "Iniciar sesión" o cuando alguien intenta entrar
 * a una sección de Recepción o Administración sin tener permiso.
 */
(function (global) {
    'use strict';
    const CG = global.CanchaGO;
    CG.vistas = CG.vistas || [];

    CG.vistas.push({
        id: 'login',
        hu: 'Mejora',
        titulo: 'Iniciar sesión',
        grupo: 'Cuenta',
        orden: 99,
        render(el, sistema, params, app) {
            const { UI } = CG;
            const sesion = sistema.auth.sesionActual();
            const aviso = params && params.requerido
                ? `<div class="aviso">La sección <b>${UI.esc(params.requerido)}</b> es solo para el personal${sesion ? ': tu rol no tiene acceso' : '. Inicia sesión para continuar'}.</div>`
                : '';
            if (sesion) {
                el.innerHTML = `
                    <div class="titulo-vista"><div><h2>Sesión iniciada</h2></div></div>
                    <div class="tarjeta login">
                        ${aviso}
                        <p>Estás conectado como <b>${UI.esc(sesion.nombre)}</b>.</p>
                        <button class="btn" id="salir" type="button">Cerrar sesión</button>
                    </div>`;
                el.querySelector('#salir').addEventListener('click', () => app.cerrarSesion());
                return;
            }
            el.innerHTML = `
                <div class="titulo-vista"><div><h2>Iniciar sesión</h2>
                <p class="muted">Solo para el personal de la cancha. Los clientes pueden reservar sin cuenta.</p></div></div>
                <div class="tarjeta login">
                    ${aviso}
                    <form id="acceso" autocomplete="off">
                        <div class="campos campos-login">
                            <label>Usuario <input name="usuario" required autocomplete="username" autocapitalize="none"></label>
                            <label>Contraseña <input name="clave" type="password" required autocomplete="current-password"></label>
                        </div>
                        <button class="btn btn-primario" type="submit">Iniciar sesión</button>
                    </form>
                </div>`;
            const form = el.querySelector('#acceso');
            form.usuario.focus();
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const datos = UI.datos(form);
                const sesionNueva = UI.intentar(() => sistema.auth.iniciarSesion(datos.usuario, datos.clave));
                if (sesionNueva) {
                    app.alIniciarSesion(sesionNueva);
                } else {
                    form.clave.value = '';
                    form.clave.focus();
                }
            });
        }
    });
})(window);
