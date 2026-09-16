*ROLES*

Cliente: Consulta si hay disponibilidad de cancha por fecha, hora, realiza la reserva mediante el pago de un anticipo recibe su ID de reserva y gestiona sus confirmaciones de asistencia.

Administrador: Organiza las canchas y sus precios según el horario, organiza la agenda de turnos, activa promociones en horas con demanda baja y controla el flujo de caja

Recepción: Registra el ingreso de los equipos a la cancha por un ID unico, valida el pago del saldo pendiente al momento de jugar y activa el tiempo de la cancha reservada.

### *2. Matriz de Transformación: Problemas, Necesidades y Requisitos Funcionales*

| # | Problema Identificado | Necesidad de Software | Requisito Funcional |
| :-: | :--- | :--- | :--- |
| **1** | Cruce y sobrereserva de horarios debido a la recepción al mismo tiempo de turnos ya sea por llamadas, WhatsApp y atención presencial. | organizar un solo canal para la agenda de disponibilidad en tiempo real evitando así reservas duplicadas en el mismo bloque horario. | El sistema debe actualizar e impedir automáticamente la selección de un bloque horario en cuanto sea reservado por otro usuario y suguerir otro horario disponible. |
| **2** | Pérdidas por ausencia  de equipos que separan cancha en horas pico y no asisten. | Implementar un mecanismo de pago ( al menos el 30% del total) para confirmar la reserva del espacio y generar su ID único de reserva | El sistema debe requerir el pago de un anticipo obligatorio mediante pasarela de pago para validar la reserva de la cancha. |
| **3** | Descuadres de caja y lentitud en recepción al añadir manualmente los abonos con los saldos faltantes y no un control entre lo pagado de froma virtual o efectivo puede existir descuadres de caja por falta de dinero. | Digitalizar el control de caja y liquidación de pagos pendientes en el punto de recepción del centro deportivo | El sistema debe permitir al operador buscar la reserva, observar el faltante registrar el pago del saldo restante y emitir un comprobante digital de ingreso y pago verificado. |
| **4** | Canchas  en horarios  baja demanda, debido a la imposibilidad de ofrecer precios más bajos o promociones. | Permitir la configuración flexible de precios y descuentos automáticos según el día y la hora para activar las reservas. | El sistema debe permitir al administrador cambiar los precios según el horario así como cupones de descuento automáticos para logar reservas en esas horas. |


