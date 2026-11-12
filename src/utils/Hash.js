/**
 * Utilidad de hash para las contraseñas (Issue #29 - Inicio de sesión).
 * SHA-256 en JavaScript puro y síncrono: funciona igual en Node y en el navegador
 * (incluso abriendo index.html directamente desde el disco) sin depender de librerías.
 */
(function (global) {
    'use strict';

    /** Vueltas del hash: encarece cada intento de adivinar una contraseña */
    const VUELTAS = 2000;
    const PRIMOS = [];
    for (let n = 2; PRIMOS.length < 64; n++) {
        if (PRIMOS.every((p) => n % p !== 0)) {
            PRIMOS.push(n);
        }
    }
    const fraccion32 = (x) => Math.floor((x - Math.floor(x)) * 4294967296) >>> 0;
    const K = PRIMOS.map((p) => fraccion32(Math.cbrt(p)));
    const H0 = PRIMOS.slice(0, 8).map((p) => fraccion32(Math.sqrt(p)));

    const rotar = (x, n) => (x >>> n) | (x << (32 - n));

    /** @param {string} texto @returns {Array<number>} Bytes UTF-8 */
    function aBytes(texto) {
        const bytes = [];
        for (const caracter of String(texto)) {
            const c = caracter.codePointAt(0);
            if (c < 0x80) {
                bytes.push(c);
            } else if (c < 0x800) {
                bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63));
            } else if (c < 0x10000) {
                bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
            } else {
                bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
            }
        }
        return bytes;
    }

    /**
     * Contrato: Calcula el SHA-256 de un texto
     * @param {string} texto
     * @returns {string} Hash en hexadecimal (64 caracteres)
     */
    function sha256(texto) {
        const bytes = aBytes(texto);
        const bits = bytes.length * 8;
        bytes.push(0x80);
        while (bytes.length % 64 !== 56) {
            bytes.push(0);
        }
        const alto = Math.floor(bits / 4294967296);
        [alto, bits >>> 0].forEach((n) => bytes.push((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255));
        const h = H0.slice();
        const w = new Array(64);
        for (let i = 0; i < bytes.length; i += 64) {
            for (let t = 0; t < 16; t++) {
                const j = i + t * 4;
                w[t] = ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) | 0;
            }
            for (let t = 16; t < 64; t++) {
                const s0 = rotar(w[t - 15], 7) ^ rotar(w[t - 15], 18) ^ (w[t - 15] >>> 3);
                const s1 = rotar(w[t - 2], 17) ^ rotar(w[t - 2], 19) ^ (w[t - 2] >>> 10);
                w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
            }
            let [a, b, c, d, e, f, g, hh] = h;
            for (let t = 0; t < 64; t++) {
                const S1 = rotar(e, 6) ^ rotar(e, 11) ^ rotar(e, 25);
                const ch = (e & f) ^ (~e & g);
                const t1 = (hh + S1 + ch + K[t] + w[t]) | 0;
                const S0 = rotar(a, 2) ^ rotar(a, 13) ^ rotar(a, 22);
                const maj = (a & b) ^ (a & c) ^ (b & c);
                const t2 = (S0 + maj) | 0;
                hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
            }
            [a, b, c, d, e, f, g, hh].forEach((v, k) => {
                h[k] = (h[k] + v) | 0;
            });
        }
        return h.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
    }

    /**
     * Contrato: Deriva el hash con el que se guarda una contraseña (sal + vueltas)
     * @param {string} clave Contraseña en texto
     * @param {string} sal Texto propio de cada usuario
     * @returns {string}
     */
    function derivar(clave, sal) {
        let hash = sha256(`${sal}:${clave}`);
        for (let i = 1; i < VUELTAS; i++) {
            hash = sha256(`${hash}:${sal}`);
        }
        return hash;
    }

    /**
     * Contrato: Compara dos textos recorriéndolos completos (sin salir en la primera diferencia)
     * @returns {boolean}
     */
    function iguales(a, b) {
        let diferencia = String(a).length ^ String(b).length;
        for (let i = 0; i < Math.max(String(a).length, String(b).length); i++) {
            diferencia |= (String(a).charCodeAt(i) || 0) ^ (String(b).charCodeAt(i) || 0);
        }
        return diferencia === 0;
    }

    const Hash = { sha256, derivar, iguales, VUELTAS };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Hash;
    } else {
        (global.CanchaGO = global.CanchaGO || {}).Hash = Hash;
    }
})(typeof window !== 'undefined' ? window : globalThis);
