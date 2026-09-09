*ROLES*

Cliente: Consulta si hay disponibilidad de cancha por fecha, hora, realiza la reserva mediante el pago de un anticipo recibe su ID de reserva y gestiona sus confirmaciones de asistencia.

Administrador: Organiza las canchas y sus precios según el horario, organiza la agenda de turnos, activa promociones en horas con demanda baja y controla el flujo de caja

Recepción: Registra el ingreso de los equipos a la cancha por un ID unico, valida el pago del saldo pendiente al momento de jugar y activa el tiempo de la cancha reservada.

### 2. Matriz de Transformación: Problemas, Necesidades y Requisitos Funcionales

| # | Problema Identificado | Necesidad de Software | Requisito Funcional |
| :-: | :--- | :--- | :--- |
| **1** | Cruce y sobrereserva de horarios debido a la recepción simultánea de turnos por llamadas, WhatsApp y atención presencial. | Centralizar la agenda de disponibilidad en tiempo real para evitar reservas duplicadas en el mismo bloque horario. | El sistema debe actualizar e impedir automáticamente la selección de un bloque horario en cuanto sea reservado por otro usuario. |
| **2** | Pérdidas económicas por ausentismo ("No-Show") de equipos que separan cancha en horas pico y no asisten. | Implementar un mecanismo de compromiso económico previo para confirmar la reserva del espacio deportivo. | El sistema debe requerir el pago de un anticipo obligatorio mediante pasarela de pago para validar la reserva de la cancha. |
| **3** | Descuadres financieros y lentitud en recepción al conciliar manualmente los abonos previos con los saldos adeudados en efectivo al ingresar. | Digitalizar el control de caja y liquidación de pagos pendientes en el punto de recepción del complejo. | El sistema debe permitir al operador buscar la reserva, registrar el pago del saldo restante y emitir un comprobante digital de ingreso. |


