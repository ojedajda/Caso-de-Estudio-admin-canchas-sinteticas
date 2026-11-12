# CanchaGO ⚽

**Plataforma web para la gestión de turnos y el control de acceso en canchas sintéticas.**

Proyecto de la asignatura **Ingeniería de Software I** – Ingeniería de Sistemas, Universidad Mariana.

## Descripción del Dominio

CanchaGO es una plataforma web para la comercialización y gestión de turnos y el control de acceso en canchas sintéticas de alta demanda. El sistema ataca problemas frecuentes:

* Reservas mal hechas por falta de sincronización de horarios en tiempo real.
* Inasistencias sin previo aviso que causan pérdidas económicas a los establecimientos.
* Mala gestión del cobro de anticipos.
* Lentitud en el control de acceso en horas pico.

## Equipo

| Rol | Integrante |
| :--- | :--- |
| Product Owner | Samuel Betancourt |
| Líder Técnico | Jesús Ojeda |
| Desarrolladora | Karol Estefany Herrera |
| Desarrolladora | Luisa Salazar |

## Gestión Ágil

* **Tablero:** [CanchaGO - Gestión Ágil](https://github.com/users/ojedajda/projects/2) (GitHub Projects, plantilla *Iterative development*).
* **Product Backlog:** 12 Historias de Usuario (Issues #1 – #12), 62 SP en total.
* **Sprints:** 3 iteraciones de 2 semanas. Velocidad planeada: 12 SP.
* **Sprint 1 (5 – 18 nov 2026):** HU04 (8 SP) + HU01 Parte 1 (4 SP). Velocidad real al corte del 12 de noviembre: **8 SP (66,7 %)**.
* **Entrega final:** las 12 Historias de Usuario están implementadas, cada una en su rama `feature/issue-<n>-...` y fusionada a `main` por un Pull Request con `Closes #<n>`.

## Documentación

| Documento | Contenido |
| :--- | :--- |
| [01_requisitos.md](DOCS/01_requisitos.md) | Problemas y requisitos funcionales |
| [02_priorizacion.md](DOCS/02_priorizacion.md) | Matriz MoSCoW y alcance del MVP |
| [03-requisitos.md](DOCS/03-requisitos.md) | Roles, estimación en Story Points, esfuerzo y costos |
| [04_plan_de_proyecto_y_modelos.md](DOCS/04_plan_de_proyecto_y_modelos.md) | Plan de Sprints y línea base |
| [05_informe_gestion_y_productividad.md](DOCS/05_informe_gestion_y_productividad.md) | Informe del Sprint 1: velocidad, burn-up, incremento y reajustes |

## Funcionalidades (12 Historias de Usuario)

| HU | Funcionalidad | Módulo web | Controlador (Facade) |
| :-: | :--- | :--- | :--- |
| HU01 | Consulta de disponibilidad en tiempo real | Cliente › Disponibilidad | `DisponibilidadController` |
| HU02 | Reserva con pago de anticipo (50 %) | Cliente › Reservar cancha | `ReservaController` |
| HU03 | Cancelación y reagendamiento con 12 h de anticipación y saldo a favor | Cliente › Cancelar / reagendar | `GestionReservaController` |
| HU04 | Canchas y tarifas dinámicas (base, pico, festivo) | Administración › Canchas y tarifas | `CanchaController` |
| HU05 | Promociones y cupones de descuento | Administración › Promociones | `PromocionController` |
| HU06 | Reporte de recaudos diarios y exportación CSV | Administración › Recaudos del día | `ReporteController` |
| HU07 | Registro de ingreso y cobro de saldo | Recepción › Ingreso y cobro | `AccesoController` |
| HU08 | Reservas presenciales o telefónicas con recibo | Recepción › Reserva en taquilla | `TaquillaController` |
| HU09 | Notificaciones de confirmación y recordatorio (WhatsApp simulado) | Administración › Notificaciones | `NotificacionController` |
| HU10 | Historial y repetición del turno frecuente | Cliente › Mi historial | `HistorialController` |
| HU11 | Calificación y reseñas del servicio | Cliente › Calificar servicio | `ResenaController` |
| HU12 | Bloqueo de emergencia con cancelación automática | Administración › Bloqueos de emergencia | `BloqueoController` |

## Arquitectura en Tres Capas

```
index.html                    # Página web (punto de entrada de la vista)
public/css/styles.css         # Estilos de la interfaz
src/
├── models/                   # Modelo: entidades del dominio (Cancha, Reserva, Cliente, Pago, ...)
├── dao/                      # Acceso a datos (DAO) + RepositorioBase + Almacen (BD simulada en localStorage)
├── controllers/              # Lógica de negocio: un controlador Facade por historia de usuario
├── views/web/                # Vista web: una vista por historia de usuario + app.js (menú y navegación)
├── views/CanchaView.js       # Vista de consola (demostración HU04)
├── utils/Fechas.js           # Calendario, festivos de Colombia 2026 y franjas horarias
└── Sistema.js                # Ensambla DAO y controladores (inyección de dependencias)
tests/                        # Pruebas automatizadas por historia de usuario (node --test)
```

* **Patrones:** Facade (un controlador por HU), DAO con `RepositorioBase` genérico e inyección de dependencias en `Sistema.js`.
* **SOLID:** responsabilidad única (SRP) por clase y abierto/cerrado: cada HU se agrega sin modificar las anteriores (dependencias opcionales como `notificador` o `promociones`).
* **Buenas prácticas:** contratos JSDoc en todos los métodos, validaciones de negocio con mensajes claros y módulos compatibles con Node y con el navegador.
* **Integración simulada con base de datos:** `Almacen` guarda cada colección en `localStorage` (navegador) o en memoria (Node/pruebas).

## Ejecución

**Página web:** abre `index.html` con doble clic (o con la extensión *Live Server* de VS Code). No necesita instalar nada.
Los clientes pueden reservar y consultar sin cuenta. Las secciones de **Recepción** y **Administración** exigen iniciar sesión (botón **Iniciar sesión**, arriba a la derecha).
Con el administrador, usa el botón **Cargar datos de demostración** para ver el sistema con reservas, pagos, reseñas y notificaciones de ejemplo.

### Inicio de sesión (Issue #29, mejora fuera de las 12 Historias de Usuario)

Cuentas de demostración:

| Rol | Usuario | Contraseña | Qué puede usar |
|---|---|---|---|
| Administrador | `admin` | `Admin2026!` | Cliente, Recepción y Administración; cargar y reiniciar datos |
| Recepción | `recepcion` | `Recepcion2026!` | Cliente y Recepción |

* Las contraseñas no están en el código: solo se guardan como hash SHA-256 con sal y 2.000 vueltas.
* 5 contraseñas incorrectas seguidas bloquean el acceso de ese usuario durante 1 minuto.
* La sesión dura 2 horas, se conserva al recargar la página y se borra al cerrar la pestaña.
* **Limitación:** es un control en el navegador, no seguridad de servidor. Quien tenga conocimientos técnicos podría saltárselo desde las herramientas del navegador, porque los datos viven en el mismo equipo. La seguridad real necesitaría un servidor con base de datos, y queda como mejora futura.

**Pruebas automatizadas y demo de consola** (requiere [Node.js](https://nodejs.org/) 18 o superior):

```powershell
git clone https://github.com/ojedajda/Caso-de-Estudio-admin-canchas-sinteticas.git
cd Caso-de-Estudio-admin-canchas-sinteticas
npm test      # 47 pruebas: al menos 2 por historia de usuario y 11 del inicio de sesión
npm start     # demostración de consola de la HU04
```

## Flujo de Trabajo (Git)

1. Mover la tarjeta del Issue a **In progress** en el tablero.
2. Crear una rama de característica desde `main`: `feature/issue-<ID>-<descripcion>`.
3. Hacer commits con el formato `feat: [<SP> SP] <descripción> (#<ID>)`.
4. Abrir un Pull Request hacia `main` con `Closes #<ID>` en la descripción y mover la tarjeta a **In review**.
5. Hacer el merge: GitHub cierra el Issue y mueve la tarjeta a **Done**.
