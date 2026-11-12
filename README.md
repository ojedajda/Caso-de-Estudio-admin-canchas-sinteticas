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
* **Sprint 1 (5 – 18 nov 2026):** HU04 (8 SP, *Done*) + HU01 Parte 1 (4 SP, *In progress*). Velocidad real: **8 SP (66,7 %)**.

## Documentación

| Documento | Contenido |
| :--- | :--- |
| [01_requisitos.md](DOCS/01_requisitos.md) | Problemas y requisitos funcionales |
| [02_priorizacion.md](DOCS/02_priorizacion.md) | Matriz MoSCoW y alcance del MVP |
| [03-requisitos.md](DOCS/03-requisitos.md) | Roles, estimación en Story Points, esfuerzo y costos |
| [04_plan_de_proyecto_y_modelos.md](DOCS/04_plan_de_proyecto_y_modelos.md) | Plan de Sprints y línea base |
| [05_informe_gestion_y_productividad.md](DOCS/05_informe_gestion_y_productividad.md) | Informe del Sprint 1: velocidad, burn-up, incremento y reajustes |

## Arquitectura en Tres Capas (HU04)

```
src/
├── models/Cancha.js                 # Modelo: entidad de dominio (SOLID - SRP)
├── dao/CanchaDAO.js                 # Acceso a datos (DAO): BD simulada en memoria
├── controllers/CanchaController.js  # Lógica de negocio + patrón Facade
└── views/CanchaView.js              # Presentación (consola)
index.js                             # Punto de entrada / demostración
```

* **Patrones:** Facade (`CanchaController`) y DAO (`CanchaDAO`).
* **Buenas prácticas:** contratos JSDoc, modularización CommonJS, validaciones de negocio y manejo de errores.

## Ejecución

Requisito: [Node.js](https://nodejs.org/) 18 o superior.

```powershell
git clone https://github.com/ojedajda/Caso-de-Estudio-admin-canchas-sinteticas.git
cd Caso-de-Estudio-admin-canchas-sinteticas
npm start
```

## Flujo de Trabajo (Git)

1. Mover la tarjeta del Issue a **In progress** en el tablero.
2. Crear una rama de característica desde `main`: `feature/issue-<ID>-<descripcion>`.
3. Hacer commits con el formato `feat: [<SP> SP] <descripción> (#<ID>)`.
4. Abrir un Pull Request hacia `main` con `Closes #<ID>` en la descripción y mover la tarjeta a **In review**.
5. Hacer el merge: GitHub cierra el Issue y mueve la tarjeta a **Done**.
