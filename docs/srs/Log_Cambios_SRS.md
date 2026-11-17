# Log de cambios del SRS

> Dos secciones: **v0.1 → v0.2** (correcciones transversales) y **v0.2 → v0.3** (ajustes de la verificación y validación de requisitos, Etapa 3).

# v0.1 → v0.2

**Documento:** SRS FoodSave (ISO/IEC/IEEE 29148) · **Fecha:** 2026-11-17 · **Autor:** _(nombre)_ · **Revisado por:** _(nombre)_

## Cambios realizados

| ID | Sección | Problema detectado | Cambio aplicado | Justificación |
|----|---------|--------------------|-----------------|---------------|
| CAM-01 | Portada | Nombre del producto escrito «FooSave» | Corregido a «FoodSave» | Consistencia con el resto del documento |
| CAM-02 | 0 y 0.1 | Versión y fecha desactualizadas | Versión 0.2, estado «Borrador corregido», fecha Noviembre de 2026 y nueva fila en el historial de revisiones | Control documental |
| CAM-03 | 3.7 (RN-08) | Sin cambio de texto: se confirma como regla oficial (3 incumplimientos acumulados → bloqueo de 3 días → se renueva el contador) | Los demás elementos del SRS se alinean con esta regla (CAM-04 a CAM-08 y CAM-13) | RN-08 contradecía SWR-INC-006, el glosario y TC-INC-002, que describían un bloqueo progresivo de 3/7/14 días |
| CAM-04 | 2.2 | Hablaba de «consecuencia progresiva» y «bloqueo temporal progresivo» | «bloqueo temporal a quienes acumulen incumplimientos» y «bloqueo temporal por incumplimientos de retiro» | Eliminar la idea de progresividad |
| CAM-05 | 5.6 (SWR-INC-006) | Duración de 3, 7 y 14 días según el número de bloqueo | «Duración fija de 3 días para todo bloqueo temporal» | Alinear con RN-08 |
| CAM-06 | 12 (SWR-MNT-003) | «las duraciones de bloqueo» (plural) | «la duración del bloqueo» | Coherencia con la duración fija |
| CAM-07 | 13.1 (TC-INC-002) | Criterio de aceptación con bloqueos de 3, 7 y 14 días | Tres incumplimientos → bloqueo de 3 días; al finalizar se renueva el contador y un nuevo ciclo genera otro bloqueo de 3 días | Alinear con RN-08 |
| CAM-08 | Anexo B | Definición de «Bloqueo temporal» con 3, 7 o 14 días | «Restricción de 3 días… tras tres incumplimientos acumulados; al finalizar se renueva el contador» | Alinear con RN-08 |
| CAM-09 | 4.2 | SYS-01 y SYS-02 sin requisito de stakeholder ni de negocio hacia arriba | Nuevo STK-GEN-03: «Todo usuario necesita registrarse y autenticarse para acceder de forma segura a las funciones que corresponden a su rol» | Cerrar la cadena SWR→SYS→STK→BR (ISO 29148) |
| CAM-10 | 5.1 | SWR-AUTH-001, 004, 005, 006, 007, 008, 009, 010 y 011 sin STK asociado | Se agrega STK-GEN-03 en su columna de trazabilidad | Idem CAM-09 |
| CAM-11 | Anexo A | La autenticación no llegaba hasta un BR | Nueva fila: BR-03 / STK-GEN-03 / SYS-01; SYS-02 / SWR-AUTH-001, 004–011 / TC-AUTH-004; TC-AUTH-005 | Trazabilidad completa. Vínculo con BR-03: el registro y la autenticación permiten incorporar usuarios y comercios sin desarrollos específicos |
| CAM-12 | 13.1 | Autenticación sin casos de prueba para credencial incorrecta ni ruta protegida | Nuevos TC-AUTH-004 (SWR-AUTH-006) y TC-AUTH-005 (SWR-AUTH-010) | Cobertura de los casos que exige la guía del proyecto |
| CAM-13 | 5.6 (SWR-INC-004, 005, 008, 010) y 13.1 (TC-INC-003) | Hablaban de incumplimientos «consecutivos» y una entrega reiniciaba el contador, lo que contradice RN-08 («acumulados») | SWR-INC-004: la entrega mantiene sin cambios el contador de incumplimientos acumulados. SWR-INC-005, 008 y 010: «acumulados» en lugar de «consecutivos». TC-INC-003: el contador se mantiene en dos tras un retiro | El contador solo se renueva al finalizar el bloqueo, como define RN-08 |

## Revisado sin cambios

- **Formato de IDs:** el Word ya usa `SWR-MOD-NNN` en todo el documento. Las diferencias vistas en la versión de texto plano eran un efecto de la conversión (saltos de línea tras el guion).
- **Referencias de trazabilidad:** estaban completas en las tablas del Word.

## Pendiente por decidir

Ninguno.

---

# v0.2 → v0.3 (Etapa 3: verificación y validación)

**Fecha:** 2026-11-17 · **Origen:** `02_Verificacion_Requisitos.xlsx` y `03_Validacion_Requisitos.xlsx` · **Autor:** _(nombre)_ · **Revisado por:** _(nombre)_

| ID | Sección | Hallazgo | Cambio aplicado | SWR afectados |
|----|---------|----------|-----------------|---------------|
| AJ-01 | 5.4 | Verificación: SWR-BUS-005 era ambiguo («buscar por el nombre»: no define coincidencia total o parcial ni sensibilidad a mayúsculas) y no se podía derivar un resultado esperado | «…buscar ofertas activas por coincidencia total o parcial con el nombre del producto, sin distinguir entre mayúsculas y minúsculas» | SWR-BUS-005 |
| AJ-02 | 4.2 | Validación: STK-CON-02 no mencionaba la búsqueda por nombre, así que SWR-BUS-005 no tenía una necesidad que lo respaldara | STK-CON-02 incluye «por nombre del producto» | SWR-BUS-005 |
| AJ-03 | 5.3 | Verificación: SWR-OFE-003 expresa dos condiciones independientes en una sola frase | Se numeran como incisos verificables por separado: (a) cantidad entera positiva y (b) precio de oferta menor al original. No se divide en dos SWR para no superar el límite de 15 del MVP | SWR-OFE-003 |
| AJ-04 | 5.5 | Verificación: SWR-RES-001 no define la cantidad válida (0, negativa o decimal) | «…indicando la cantidad deseada, que deberá ser un número entero positivo» | SWR-RES-001 |
| AJ-05 | 5.5 | Verificación: SWR-RES-002 reúne tres condiciones y no dice qué se informa al usuario cuando falla | Incisos (a), (b) y (c), y «deberá rechazar la reserva informando al consumidor la condición que no se cumple» | SWR-RES-002 |
| AJ-06 | 5.5 | Verificación: SWR-RES-005 no precisa a qué día corresponde «la hora de cierre de la sede», aunque el horario es por día de la semana (SWR-COM-014) | «…la hora de cierre de la sede del día de la reserva…» | SWR-RES-005 |
| AJ-07 | 5 y Anexo A | Validación: seis SWR seleccionados no llegaban a un STK ni a un BR (SWR-SEC-002, OFE-003, BUS-001, BUS-005, RES-002, RES-003) | Se agregó STK en la columna de trazabilidad de SEC-002, OFE-003, RES-002 y RES-003; en el Anexo A se agregaron a las filas BR-03/STK-GEN-03 (SEC-002), BR-01/STK-DUE-03 (OFE-003, RES-002, RES-003), BR-01/STK-CON-01 (BUS-001, BUS-005) y BR-02/STK-CON-03 (RES-002, RES-003) | SEC-002, OFE-003, BUS-001, BUS-005, RES-002, RES-003 |
| AJ-08 | Anexo A | Validación: SWR-RES-015 (marcar «Entregada») solo se trazaba a BR-03, pero la entrega es el evento que mide el retiro de BR-02 (SWR-ADM-014) | Nueva fila: BR-02 / STK-PER-02 / SYS-13 / SWR-RES-015. Se conserva el vínculo con BR-03 | SWR-RES-015 |

Cambios de control documental: versión 0.3 y nueva fila en el historial de revisiones.

## Revisado sin cambio

SWR-AUTH-001, 005, 006, 010, SWR-OFE-001, SWR-RES-003, 011 y 015 tienen observaciones (por ejemplo, dependencia de permisos por persona o de la política de contraseñas) que se documentan en la verificación pero no modifican el texto del SRS, porque corresponden a requisitos fuera del alcance del MVP.

---

# Notas posteriores a v0.3 (Etapa 6: plan de desarrollo con IA)

**Fecha:** 2026-11-17 · **Origen:** plan de desarrollo aprobado (`docs/plan/plan_aprobado.md`) · **El texto del SRS no cambia; sigue en v0.3.**

| ID | Tema | Nota |
|----|------|------|
| NP-01 | TC-AUTH-005 (SWR-AUTH-010) | El caso dice que se deniega el acceso y se redirige al inicio de sesión. En la implementación, sin sesión se redirige a /login con «Debes iniciar sesión»; con sesión y rol incorrecto se muestra «No tienes permiso para realizar esta acción» sin redirigir. Se interpreta que la redirección aplica al caso sin sesión. |
| NP-02 | SYS-06 | La declaración de la condición del producto no se captura en el MVP; los campos obligatorios de la oferta son producto, precios, cantidad, vencimiento y sede (dependencia implícita c). |
| NP-03 | SWR-BUS-001 y RN-03 | El listado muestra solo ofertas activas con unidades disponibles y vencimiento posterior a la hora actual; no hay cierre automático (SWR-OFE-012 fuera del MVP). |
| NP-04 | SWR-RES-011 y RN-09 | Se cancela solo una reserva RESERVADA con plazo vigente (ahora menor que el plazo de retiro). Una reserva con plazo vencido no se cancela, sí se puede entregar, y su stock no se libera por no haber expiración (SWR-RES-018 fuera). |
| NP-05 | SWR-RES-005 | Una sede abierta las 24 horas no tiene hora de cierre; el plazo es el menor entre las 12 horas y el vencimiento. |
| NP-06 | Dependencia implícita (e) | `GET /sedes/mias` permite elegir la sede al publicar y filtrar las reservas de la sede (SWR-OFE-001 y SWR-RES-015). |

