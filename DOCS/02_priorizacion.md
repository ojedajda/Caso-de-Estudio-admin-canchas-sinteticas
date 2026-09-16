### 1. Matriz de Priorización y Análisis de Valor

| ID Issue | Historia de Usuario | Categoría MoSCoW | Criterio de Impacto (Valor de Negocio) | Justificación Estratégica | Estimación Empírica (Cualitativa) | 
| :-: | :--- | :-: | :-: | :--- | :--- |
| **#1** | HU01 - Consulta de Disponibilidad de Canchas | **Must Have** | Impacto Operativo | Evita reservas repetidas y garantiza la visualización en tiempo real del estado de  horarios. | Complejidad Media (organizacion de agendas en tiempo real). |
| **2** | HU02 - Reserva de Cancha con Pago de Anticipo | **Must Have** | Impacto Financiero y Seguridad | Garantiza el pago previo del abono para reducir pérdidas monetarias por faltas (No-Show). | Complejidad Alta (Integración pasarela de pagos web). |
| **#3** | HU03 - Cancelación y Reagendar de Turnos | **Should Have** | Impacto UX | añade accesibilidad al usuario para reprogramar dentro de los límites de las políticas del establecimiento. | Complejidad Media (Lógica de tiempo y liberación automática de espacios). |
| **#4** | HU04 - Configuración de Canchas y Tarifas Dinámicas | **Must Have** | Impacto Financiero | Permite al administrador definir precios por hora pico y habilitar canchas para la venta. | Complejidad Baja-Media (Gestión de precios y tarifas por horarios). |
| **#5** | HU05 - Creación de Promociones y Descuentos | **Could Have** | Impacto Comercial | Ayuda a incentivar la reserva en horas de baja demanda mediante cupones automáticos. | Complejidad Baja (Cálculo  de descuentos en el checkout). |
| **#6** | HU06 - Reporte y Monitoreo de Recaudos Diarios | **Must Have** | Impacto Financiero | Permite el cierre de caja, auditoría e indicadores  del establecimiento. | Complejidad Media (Consultas a base de datos ). |
| **#7** | HU07 - Registro de Ingreso y Cobro de Saldo | **Must Have** | Impacto Operativo | Permite cuadrar el saldo que se debe al llegar el equipo y autorizar la entrada a la cancha. | Complejidad Baja (Búsqueda rápida y actualización de estado). |
| **#8** | HU08 - Registro Manual de Reservas Presenciales o telefónicas | **Must Have** | Impacto Operativo | Evita que reservas hechas en ventanilla o llamada se crucen con los turnos habilitados en la web. | Complejidad Baja (Formulario de registro conectado en recepción y web). |
| **#9** | HU09 - Notificaciones Automáticas de Confirmación y Recordatorio | **Should Have** | Impacto UX | Reduce la inasistencia por olvido y envía los detalles de acceso e instrucciones al cliente. | Complejidad Media (Integración de API externa de correo o mensajería). |
| **#10** | HU10 - Historial de Reservas y Repetición de Turno Frecuente | **Could Have** | Impacto UX | Mejora la fidelización al permitir reservar nuevamente en el horario habitual de reserva del usuario | Complejidad Baja (Consultas filtradas por usuario en base de datos). |
| **#11** | HU11 - Calificación y Reseña del Servicio de la Cancha | **Won't Have** | Impacto UX | Recoge retroalimentación pública sobre la calidad y la atención. | Complejidad Baja (Formulario de estrellas y texto). |
| **#12** | HU12 - Bloqueo de Emergencia por Mantenimiento o Imprevistos | **Should Have** | Impacto Operativo | Inhabilita la cancha por mal tiempo o reparaciones urgentes evitando falsas reservas. | Complejidad Baja (Cambio de estado en agenda de disponibilidad). |


### *2. Alcance del Producto Mínimo Viable (MVP)*

El Producto Mínimo Viable (MVP) para el lanzamiento del sistema se compondrá únicamente de las historias clasificadas como **Must Have** (`#1`, `#2`, `#4`, `#6`, `#7` y `#8`).

- **Justificación de Selección:** Se cubren las tres dimensiones críticas del negocio: gestión de agenda en tiempo real para evitar duplicidades, aseguramiento del recaudo financiero mediante anticipos obligatorios y la conciliación/cobro de saldos en la recepción del establecimiento.
- **Funcionalidades Postergadas:** Las historias clasificadas como **Should Have**, **Could Have** y **Won't Have** (`#3`, `#5`, `#9`, `#10`, `#11` y `#12`) se posponen para las siguientes fases de desarrollo. La reagendación, los descuentos comerciales y las notificaciones automáticas se gestionarán de forma manual por el operador mientras se valida la adopción inicial del sistema.
