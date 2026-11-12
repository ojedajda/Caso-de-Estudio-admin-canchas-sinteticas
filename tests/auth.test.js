/**
 * Pruebas del inicio de sesión y roles (Issue #29 - mejora fuera de las 12 HU)
 * Criterio 1: sin sesión solo se usa el grupo Cliente.
 * Criterio 2: Recepción y Administración exigen contraseña y cada rol ve solo lo suyo.
 * Criterio 3: contraseñas sin texto plano, bloqueo tras 5 intentos, sesión de 2 h y cierre de sesión.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { AHORA, nuevoSistema } = require('./ayuda');
const Hash = require('../src/utils/Hash');

const minutos = (n) => new Date(AHORA.getTime() + n * 60 * 1000);

test('Hash - SHA-256 coincide con el de Node para textos vacíos, con tildes y largos', () => {
    ['', 'abc', 'contraseña ñ €', 'a'.repeat(1000)].forEach((texto) => {
        assert.strictEqual(Hash.sha256(texto), crypto.createHash('sha256').update(texto).digest('hex'));
    });
});

test('Auth criterio 1 - sin sesión solo se puede usar el grupo Cliente', () => {
    const { auth } = nuevoSistema();
    assert.strictEqual(auth.sesionActual(AHORA), null);
    assert.deepStrictEqual(auth.gruposPermitidos(AHORA), ['Cliente']);
    assert.strictEqual(auth.puedeVerGrupo('Cliente', AHORA), true);
    assert.strictEqual(auth.puedeVerGrupo('Recepción', AHORA), false);
    assert.strictEqual(auth.puedeVerGrupo('Administración', AHORA), false);
    assert.throws(() => auth.exigirGrupo('Administración', AHORA), /Inicia sesión para entrar a la sección Administración/);
    assert.strictEqual(auth.esAdministrador(AHORA), false);
});

test('Auth criterio 2 - cada rol ve solo lo que le corresponde', () => {
    const { auth } = nuevoSistema();
    const recepcion = auth.iniciarSesion('recepcion', 'Recepcion2026!', AHORA);
    assert.strictEqual(recepcion.rol, 'RECEPCION');
    assert.deepStrictEqual(auth.gruposPermitidos(AHORA), ['Cliente', 'Recepción']);
    assert.throws(() => auth.exigirGrupo('Administración', AHORA), /Tu rol no tiene acceso a la sección Administración/);
    assert.strictEqual(auth.esAdministrador(AHORA), false);
    auth.cerrarSesion();
    const admin = auth.iniciarSesion('ADMIN', 'Admin2026!', AHORA);        // el usuario no distingue mayúsculas
    assert.strictEqual(admin.rol, 'ADMINISTRADOR');
    assert.deepStrictEqual(auth.gruposPermitidos(AHORA), ['Cliente', 'Recepción', 'Administración']);
    assert.strictEqual(auth.esAdministrador(AHORA), true);
});

test('Auth criterio 2 - contraseña incorrecta o usuario inexistente se rechazan con el mismo mensaje', () => {
    const { auth } = nuevoSistema();
    assert.throws(() => auth.iniciarSesion('admin', 'incorrecta', AHORA), /Usuario o contraseña incorrectos \(te quedan 4 intentos\)/);
    assert.throws(() => auth.iniciarSesion('nadie', 'Admin2026!', AHORA), /Usuario o contraseña incorrectos/);
    assert.throws(() => auth.iniciarSesion('admin', '', AHORA), /Escribe tu usuario y tu contraseña/);
    assert.strictEqual(auth.sesionActual(AHORA), null);
});

test('Auth criterio 3 - la sesión no expone la contraseña ni su hash y la contraseña no se guarda en texto', () => {
    const s = nuevoSistema();
    const sesion = s.auth.iniciarSesion('admin', 'Admin2026!', AHORA);
    assert.deepStrictEqual(Object.keys(sesion).sort(), ['expira', 'nombre', 'rol', 'usuario']);
    const guardado = JSON.stringify(s.daos.usuarioDAO.obtenerTodas());
    ['Admin2026!', 'Recepcion2026!'].forEach((clave) => assert.strictEqual(guardado.includes(clave), false));
    assert.strictEqual(fs.readFileSync(path.join(__dirname, '../src/dao/UsuarioDAO.js'), 'utf8').includes('2026!'), false);
});

test('Auth criterio 3 - 5 intentos fallidos bloquean 1 minuto, incluso con la contraseña correcta', () => {
    const { auth } = nuevoSistema();
    for (let i = 0; i < 4; i++) {
        assert.throws(() => auth.iniciarSesion('admin', 'mala', AHORA), /Usuario o contraseña incorrectos/);
    }
    assert.throws(() => auth.iniciarSesion('admin', 'mala', AHORA), /bloqueado por 1 minuto/);
    assert.throws(() => auth.iniciarSesion('admin', 'Admin2026!', minutos(0.5)), /Intenta de nuevo en 30 s/);
    assert.strictEqual(auth.sesionActual(minutos(0.5)), null);
    assert.strictEqual(auth.iniciarSesion('admin', 'Admin2026!', minutos(1)).rol, 'ADMINISTRADOR');
});

test('Auth criterio 3 - el bloqueo de un usuario no afecta a otro', () => {
    const { auth } = nuevoSistema();
    for (let i = 0; i < 5; i++) {
        assert.throws(() => auth.iniciarSesion('admin', 'mala', AHORA));
    }
    assert.strictEqual(auth.iniciarSesion('recepcion', 'Recepcion2026!', AHORA).rol, 'RECEPCION');
});

test('Auth criterio 3 - la sesión caduca a las 2 horas', () => {
    const { auth } = nuevoSistema();
    auth.iniciarSesion('admin', 'Admin2026!', AHORA);
    assert.strictEqual(auth.sesionActual(minutos(119))?.rol, 'ADMINISTRADOR');
    assert.strictEqual(auth.sesionActual(minutos(120)), null);
    assert.deepStrictEqual(auth.gruposPermitidos(minutos(120)), ['Cliente']);
});

test('Auth criterio 3 - cerrar sesión devuelve al acceso solo de Cliente', () => {
    const { auth } = nuevoSistema();
    auth.iniciarSesion('admin', 'Admin2026!', AHORA);
    auth.cerrarSesion();
    assert.strictEqual(auth.sesionActual(AHORA), null);
    assert.strictEqual(auth.puedeVerGrupo('Administración', AHORA), false);
});

test('Auth - la sesión y los intentos fallidos sobreviven a recargar la página', () => {
    let guardado = null;
    const adaptador = { leer: () => guardado && JSON.parse(guardado), guardar: (estado) => { guardado = JSON.stringify(estado); } };
    const primera = nuevoSistema().auth;
    primera.usarAlmacenSesion(adaptador);
    primera.iniciarSesion('admin', 'Admin2026!', AHORA);
    const recargada = nuevoSistema().auth;
    recargada.usarAlmacenSesion(adaptador);
    assert.strictEqual(recargada.sesionActual(minutos(10))?.usuario, 'admin');
    recargada.cerrarSesion();
    for (let i = 0; i < 5; i++) {
        assert.throws(() => recargada.iniciarSesion('admin', 'mala', AHORA));
    }
    const otraRecarga = nuevoSistema().auth;
    otraRecarga.usarAlmacenSesion(adaptador);
    assert.throws(() => otraRecarga.iniciarSesion('admin', 'Admin2026!', minutos(0.2)), /Intenta de nuevo en/);
});

test('Auth - todas las pantallas pertenecen a un grupo conocido, así ninguna queda sin protección', () => {
    const carpeta = path.join(__dirname, '../src/views/web');
    const conocidos = ['Cliente', 'Recepción', 'Administración', 'Cuenta'];
    const conteo = {};
    fs.readdirSync(carpeta).filter((f) => /^vista.*\.js$/.test(f)).forEach((archivo) => {
        const grupo = /grupo:\s*'([^']+)'/.exec(fs.readFileSync(path.join(carpeta, archivo), 'utf8'));
        assert.ok(grupo, `${archivo} debe declarar su grupo`);
        assert.ok(conocidos.includes(grupo[1]), `${archivo} usa el grupo desconocido ${grupo[1]}`);
        conteo[grupo[1]] = (conteo[grupo[1]] || 0) + 1;
    });
    assert.deepStrictEqual(conteo, { Cliente: 5, Recepción: 2, Administración: 5, Cuenta: 1 });
});
