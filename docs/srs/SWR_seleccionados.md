# SWR seleccionados para el MVP de FoodSave

Fuente: `SRS_FoodSave_v0.3` y `01_Alcance_y_Trazabilidad.xlsx`. Estos son los **únicos** 15 requisitos de software que se implementan. Los IDs son los originales del SRS.

## SWR-AUTH-001
- **Requisito:** El software deberá permitir a una persona registrarse como consumidor proporcionando su nombre completo, correo electrónico y contraseña.
- **Módulo:** Usuarios y autenticación · **Orden de desarrollo:** 1
- **Trazabilidad:** SYS-01 → STK-GEN-03 → BR-03
- **Método de verificación:** Prueba funcional

## SWR-AUTH-005
- **Requisito:** El software deberá permitir a los usuarios autenticarse mediante el correo electrónico y la contraseña de su cuenta.
- **Módulo:** Usuarios y autenticación · **Orden de desarrollo:** 1
- **Trazabilidad:** SYS-01; SYS-02 → STK-GEN-03 → BR-03
- **Método de verificación:** Prueba funcional

## SWR-AUTH-006
- **Requisito:** Cuando las credenciales suministradas no sean válidas, el software deberá rechazar el acceso sin revelar cuál de los datos de autenticación es incorrecto.
- **Módulo:** Usuarios y autenticación · **Orden de desarrollo:** 1
- **Trazabilidad:** SYS-02 → STK-GEN-03 → BR-03
- **Método de verificación:** Prueba de seguridad
- **TC-AUTH-004:** Un usuario intenta iniciar sesión con una contraseña incorrecta; el sistema rechaza el acceso con un mensaje genérico, sin revelar si el correo o la contraseña es el dato incorrecto.

## SWR-AUTH-010
- **Requisito:** Cuando un usuario autenticado solicite una función protegida, el software deberá autorizar la operación únicamente si su rol y sus permisos incluyen dicha función.
- **Módulo:** Usuarios y autenticación · **Orden de desarrollo:** 1
- **Trazabilidad:** SYS-02 → STK-GEN-03 → BR-03
- **Método de verificación:** Prueba de seguridad
- **TC-AUTH-005:** Un usuario sin sesión iniciada, o sin el rol requerido, intenta acceder a una ruta protegida; el sistema deniega el acceso y lo redirige al inicio de sesión.

## SWR-SEC-002
- **Requisito:** El software deberá almacenar las contraseñas con un mecanismo de hash adaptativo con sal y no deberá almacenarlas en texto plano.
- **Módulo:** Usuarios y autenticación · **Orden de desarrollo:** 1
- **Trazabilidad:** SYS-02 → STK-GEN-03 → BR-03
- **Método de verificación:** Inspección de seguridad

## SWR-OFE-001
- **Requisito:** El software deberá permitir al personal con permiso y al dueño publicar ofertas asociadas a una sede de su comercio.
- **Módulo:** Ofertas e inventario · **Orden de desarrollo:** 2
- **Trazabilidad:** SYS-06 → STK-PER-01 → BR-01 · RN-12
- **Método de verificación:** Prueba funcional

## SWR-OFE-003
- **Requisito:** Antes de publicar una oferta, el software deberá verificar que (a) la cantidad sea un número entero positivo y (b) el precio de oferta sea menor que el precio original.
- **Módulo:** Ofertas e inventario · **Orden de desarrollo:** 2
- **Trazabilidad:** SYS-06 → STK-DUE-03; STK-PER-01 → BR-01
- **Método de verificación:** Prueba funcional

## SWR-BUS-001
- **Requisito:** El software deberá permitir a cualquier visitante consultar el listado de ofertas activas con unidades disponibles sin requerir autenticación.
- **Módulo:** Consulta de ofertas · **Orden de desarrollo:** 3
- **Trazabilidad:** SYS-10 → STK-CON-01 → BR-01
- **Método de verificación:** Prueba funcional

## SWR-BUS-005
- **Requisito:** El software deberá permitir buscar ofertas activas por coincidencia total o parcial con el nombre del producto, sin distinguir entre mayúsculas y minúsculas.
- **Módulo:** Consulta de ofertas · **Orden de desarrollo:** 3
- **Trazabilidad:** SYS-10 → STK-CON-02 → BR-01
- **Método de verificación:** Prueba funcional

## SWR-RES-001
- **Requisito:** El software deberá permitir a un consumidor autenticado crear una reserva sobre una oferta activa indicando la cantidad deseada, que deberá ser un número entero positivo.
- **Módulo:** Reservas · **Orden de desarrollo:** 4
- **Trazabilidad:** SYS-11 → STK-CON-03 → BR-02
- **Método de verificación:** Prueba funcional

## SWR-RES-002
- **Requisito:** Antes de crear una reserva, el software deberá verificar que (a) la oferta esté activa, (b) el producto no esté vencido y (c) la cantidad solicitada no supere las unidades disponibles, y deberá rechazar la reserva informando al consumidor la condición que no se cumple.
- **Módulo:** Reservas · **Orden de desarrollo:** 4
- **Trazabilidad:** SYS-07; SYS-11 → STK-CON-03; STK-DUE-03; STK-PER-01 → BR-02; BR-01 · RN-03
- **Método de verificación:** Prueba funcional

## SWR-RES-003
- **Requisito:** Cuando se cree una reserva, el software deberá registrarla automáticamente en estado «Reservada» y descontar la cantidad del inventario de la oferta, sin requerir confirmación previa del comercio.
- **Módulo:** Reservas · **Orden de desarrollo:** 4
- **Trazabilidad:** SYS-09; SYS-11 → STK-CON-03; STK-DUE-03; STK-PER-01 → BR-02; BR-01 · RN-13
- **Método de verificación:** Prueba funcional

## SWR-RES-005
- **Requisito:** Al crear una reserva, el software deberá calcular su plazo de retiro como el menor valor entre 12 horas desde la reserva, la hora de cierre de la sede del día de la reserva y la fecha y hora de vencimiento del producto.
- **Módulo:** Reservas · **Orden de desarrollo:** 4
- **Trazabilidad:** SYS-11 → STK-CON-03 → BR-02 · RN-02
- **Método de verificación:** Prueba funcional
- **TC-RES-001:** Con reserva a las 17:00, cierre de la sede a las 20:00 y vencimiento del producto a las 23:00, el plazo de retiro es las 20:00.
- **TC-RES-002:** Con reserva a las 07:00, cierre de la sede a las 20:00 y vencimiento del producto a las 23:00, el plazo de retiro es las 19:00 (12 horas).
- **TC-RES-003:** Con reserva a las 10:00, cierre de la sede a las 21:00 y vencimiento del producto a las 15:00, el plazo de retiro es las 15:00.

## SWR-RES-011
- **Requisito:** El software deberá permitir al consumidor cancelar una reserva en estado «Reservada» mientras su plazo de retiro esté vigente, reintegrando las unidades al inventario.
- **Módulo:** Reservas · **Orden de desarrollo:** 5
- **Trazabilidad:** SYS-12 → STK-CON-05 → BR-05 · RN-09
- **Método de verificación:** Prueba funcional
- **TC-RES-005:** Un consumidor cancela una reserva antes de vencer su plazo; la reserva pasa a «Cancelada» y la cantidad se reintegra al inventario.

## SWR-RES-015
- **Requisito:** El software deberá permitir al personal con permiso y al dueño marcar una reserva en estado «Reservada» como «Entregada».
- **Módulo:** Reservas · **Orden de desarrollo:** 5
- **Trazabilidad:** SYS-13 → STK-PER-02 → BR-02; BR-03 · RN-10
- **Método de verificación:** Prueba funcional

## Reglas de negocio relacionadas

- **RN-02:** El plazo de retiro de una reserva es el menor entre 12 horas desde la reserva, la hora de cierre de la sede y la fecha y hora de vencimiento del producto.
- **RN-03:** No se puede publicar ni reservar un producto vencido; la oferta se cierra automáticamente al vencer.
- **RN-09:** El consumidor puede cancelar su reserva sin restricción mientras no venza el plazo de retiro.
- **RN-10:** El personal y el dueño pueden actualizar el estado de las reservas según los permisos otorgados por el dueño.
- **RN-12:** Cada oferta pertenece a una sede y su inventario se maneja por sede.
- **RN-13:** La reserva se crea de forma automática, descuenta el stock y queda en estado «Reservada», sin confirmación previa del comercio.

## Dependencias implícitas (no cuentan entre los 15)

- Correo único (SWR-AUTH-004): restricción de unicidad en la base de datos.
- Mostrar el plazo de retiro en la confirmación de la reserva (SWR-RES-006).
- Campos obligatorios de la oferta (SWR-OFE-002): producto, precio original, precio de oferta, cantidad, vencimiento y sede. La declaración de condición del producto (SYS-06) no se captura en el MVP.
- Listados mínimos de reservas para cancelar y entregar desde la interfaz (SWR-RES-013, SWR-RES-020, SWR-RES-021).
- Listado de sedes del usuario, `GET /sedes/mias` (dependencia implícita e): necesario para elegir la sede al publicar una oferta y para filtrar las reservas de la sede.
