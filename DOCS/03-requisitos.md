1. Integrantes y Asignación de Roles

Product Owner: Samuel Betancourt 

Líder Técnico: Jesus Ojeda

Desarrollador(a) 1: Estefany Herrera

Desarrollador(a) 2: Luisa Salazar 

2. Parámetros Base de Estimación

Historia Pivote Seleccionada: [Nombre e ID de la HU Pivote]

Puntaje Pivote Asignado: [1 SP o 2 SP]

Factor de Conversión (Fc): 1 SP = 8 Horas.

Tarifa Hora (Th): $45.000 COP/Hora.


### 3.3. Cálculo de Sumatorias Totales

$$\text{Total SP} = 13 + 5 + 3 + 8 + 3 + 5 + 5 + 5 + 5 + 3 + 2 + 5 = 62\text{ SP}$$

$$E_{\text{total}} = 104 + 40 + 24 + 64 + 24 + 40 + 40 + 40 + 40 + 24 + 16 + 40 = 496\text{ Horas}$$

$$C_{\text{total}} = \$4.680.000 + \$1.800.000 + \$1.080.000 + \$2.880.000 + \$1.080.000 + \$1.800.000 + \$1.800.000 + \$1.800.000 + \$1.800.000 + \$1.080.000 + \$720.000 + \$1.800.000 = \$22.320.000\text{ COP}$$

#### Matriz Resumen Consolidada CanchaGo:

| ID Issue | Historia de Usuario | Categoría MoSCoW | Story Points (SP) | Factor ($F_c$) | Esfuerzo ($E_i$) | Tarifa ($T_h$) | Costo Financiero ($C_i$) | Justificación Técnica Juicio de Expertos |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **#1** | **HU01 - Consulta de Disponibilidad de Canchas** | **Must Have** | **13 SP** | 8 hrs/SP | 104 hrs | $45.000 COP | $4.680.000 COP | Alta concurrencia, consultas en tiempo real con múltiples filtros (fecha, hora, tipo) y lógica de bloqueo temporal. |
| **#2** | **HU02 - Reserva de Cancha con Pago de Anticipo** | **Must Have** | **5 SP** | 8 hrs/SP | 40 hrs | $45.000 COP | $1.800.000 COP | Integración de pasarela de pagos, gestión de webhooks, tokens de transacción y confirmación en tiempo real. |
| **#3** | **HU03 - Cancelación y Reagendar de Turnos** | **Should Have** | **3 SP** | 8 hrs/SP | 24 hrs | $45.000 COP | $1.080.000 COP | Lógica de reglas de negocio según tiempo límite pre-partido, gestión de saldos a favor o reembolsos parciales. |
| **#4** | **HU04 - Configuración de Canchas y Tarifas Dinámicas** | **Must Have** | **8 SP** | 8 hrs/SP | 64 hrs | $45.000 COP | $2.880.000 COP | Matriz compleja de tarifas según franja horaria (pico/valle), días festivos y características del campo de juego. |
| **#5** | **HU05 - Creación de Promociones y Descuentos** | **Could Have** | **3 SP** | 8 hrs/SP | 24 hrs | $45.000 COP | $1.080.000 COP | Motor de reglas para cupones, descuentos porcentuales o montos fijos y validación en el checkout. |
| **#6** | **HU06 - Reporte y Monitoreo de Recaudos Diarios** | **Must Have** | **5 SP** | 8 hrs/SP | 40 hrs | $45.000 COP | $1.800.000 COP | Consultas agregadas a la base de datos, generación de reportes financieros y exportación en PDF/Excel. |
| **#7** | **HU07 - Registro de Ingreso y Cobro de Saldo Restante** | **Must Have** | **5 SP** | 8 hrs/SP | 40 hrs | $45.000 COP | $1.800.000 COP | Interfaz rápida para recepción, validación de reserva y actualización del estado de cuenta a "Pagado/Ingresado". |
| **#8** | **HU08 - Registro Manual de Reservas Presenciales o telefónicas** | **Must Have** | **5 SP** | 8 hrs/SP | 40 hrs | $45.000 COP | $1.800.000 COP | Módulo de taquilla con gestión de reservas 'over-the-counter', bloqueo inmediato en la agenda global y recibos. |
| **#9** | **HU09 - Notificaciones Automáticas de Confirmación y Recordatorio** | **Should Have** | **5 SP** | 8 hrs/SP | 40 hrs | $45.000 COP | $1.800.000 COP | Integración con APIs de terceros (Twilio / WhatsApp Business API / SendGrid) y tareas programadas (Cron jobs). |
| **#10** | **HU10 - Historial de Reservas y Repetición de Turno Frecuente** | **Could Have** | **3 SP** | 8 hrs/SP | 24 hrs | $45.000 COP | $1.080.000 COP | Perfil de usuario con historial navegable y función de "Re-reservar" o suscripción a turno fijo semanal. |
| **#11** | **HU11 - Calificación y Reseña del Servicio de la Cancha** | **Won't Have** | **2 SP** | 8 hrs/SP | 16 hrs | $45.000 COP | $720.000 COP | **[Pivote Base]** Sistema CRUD simple de puntuación (estrellas/comentarios) y cálculo de promedios. |
| **#12** | **HU12 - Bloqueo de Emergencia por Mantenimiento o Imprevistos** | **Should Have** | **5 SP** | 8 hrs/SP | 40 hrs | $45.000 COP | $1.800.000 COP | Inhabilitación inmediata de agenda, lógica de cancelación masiva automática y notificación a usuarios afectados. |
| **TOTAL** | **Backlog Completo CanchaGo** | **--** | **62 SP** | **--** | **496 hrs** | **--** | **$22.320.000 COP** | **Proyecto Completo Estimado** |
