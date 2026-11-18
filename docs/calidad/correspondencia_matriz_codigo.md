# Correspondencia entre la matriz de pruebas y el código real

> **Etapa 8 · análisis previo.** Este documento solo describe: no se escribió código de pruebas ni se tocó la base de datos.
> Base del análisis: commit `9833d9c` de `develop` (todos los PR de las ramas de desarrollo fusionados), fecha 2026-11-18.
> Fuente de la matriz: `docs/calidad/04_Matriz_Pruebas.xlsx` **versión 2** (12 hojas, 58 casos: 10 BB, 16 UNIT, 7 WB, 12 RTL, 8 API, 5 E2E).
> Código analizado: `apps/api` (NestJS + Prisma) y `apps/web` (Next.js). Las pruebas Jest existentes se ejecutaron solo para leer sus nombres y resultados (`npx jest --json`, salida fuera del repositorio).

## 0. Resumen

| Tema | Resultado |
|---|---|
| UNIT-01…16 y WB-01…07 | **23 de 23 tienen prueba**, en los archivos previstos por la matriz. Jest: `114` pruebas en `16` suites, todas pasan. `86` pruebas más no corresponden a un ID de la matriz (§1.4). |
| API real frente a «Contrato provisional» | Los **10 endpoints** del contrato existen con la ruta, el método y los roles previstos. **8 diferencias** (D-01…D-08, §2.6), ninguna rompe los casos API-01…API-08. 7 códigos de error del código no están como «Código de error» en «Datos y mensajes» y 2 más no figuran en ninguna parte (§2.5). |
| Textos de la interfaz | Los **19 mensajes** de «Datos y mensajes» existen o llegan de la API. **96 entradas de texto propias de la interfaz** (algunas agrupan varios textos de un mismo componente) no están en esa hoja (§3); de ellas 9 ya se citan entre «…» en otras hojas (botones y campos que usan BB, RTL y E2E). |
| RTL-01…12 | Los **6 componentes** existen en la ruta prevista (`apps/web/src/components/*.tsx`) y exponen los nombres que usa la matriz. **Ningún `*.test.tsx` existe todavía.** La infraestructura (Vitest, jsdom, RTL, `user-event`, stubs) está lista (§4). |
| E2E-01…05 | Existe un localizador estable por rol, etiqueta o texto para cada paso (§5). **No existen** la carpeta `e2e/`, `@playwright/test` ni `playwright.config`, ni la carpeta `postman/` de la colección. |
| Estado en la matriz | La columna «Estado» sigue en «Pendiente» en las 58 filas: no se actualizó con las Etapas 7 y 8 (§6). |

## 1. Casos UNIT-xx y WB-xx frente a las pruebas reales

La coincidencia se hizo por el ID en el nombre de la prueba (`describe` y `it`). Las 23 filas de la matriz apuntan a archivos que existen con ese nombre.

### 1.1 Pruebas unitarias (UNIT-01…UNIT-16)

| ID | SWR | Archivo previsto en la matriz | ¿Archivo real = previsto? | Pruebas que lo cubren (resultado) |
|---|---|---|---|---|
| UNIT-01 | SWR-RES-005 | `apps/api/src/reservas/plazo-retiro.spec.ts` | ✔ | `UNIT-01 / TC-RES-002: limita las 12 horas (07:00, cierre 20:00, vence 23:00 → 19:00)` (pasa) |
| UNIT-02 | SWR-RES-005 | `apps/api/src/reservas/plazo-retiro.spec.ts` | ✔ | `UNIT-02 / TC-RES-001: limita el cierre de la sede (17:00, cierre 20:00, vence 23:00 → 20:00)` (pasa) |
| UNIT-03 | SWR-RES-005 | `apps/api/src/reservas/plazo-retiro.spec.ts` | ✔ | `UNIT-03 / TC-RES-003: limita el vencimiento tras el cierre (10:00, cierre 21:00, vence 15:00 → 15:00)` (pasa) |
| UNIT-04 | SWR-OFE-003 | `apps/api/src/ofertas/validar-oferta.spec.ts` | ✔ | `UNIT-04: rechaza cantidad cero con CANTIDAD_INVALIDA` (pasa) |
| UNIT-05 | SWR-OFE-003 | `apps/api/src/ofertas/validar-oferta.spec.ts` | ✔ | `UNIT-05: rechaza un precio de oferta igual al original con PRECIO_INVALIDO` (pasa) |
| UNIT-06 | SWR-OFE-003 | `apps/api/src/ofertas/validar-oferta.spec.ts` | ✔ | `UNIT-06: acepta el mínimo permitido (cantidad 1, precio de oferta 7999 < 8000)` (pasa) |
| UNIT-07 | SWR-RES-002 | `apps/api/src/reservas/verificar-reserva.spec.ts` | ✔ | `UNIT-07: una cantidad mayor al stock se rechaza con STOCK_INSUFICIENTE` (pasa) |
| UNIT-08 | SWR-SEC-002 | `apps/api/src/auth/password.spec.ts` | ✔ | `guarda la contraseña con hash y sal, y verifyPassword distingue la clave correcta` (pasa) |
| UNIT-09 | SWR-RES-011 | `apps/api/src/reservas/verificar-cancelacion.spec.ts` | ✔ | `UNIT-09: permite cancelar una reserva RESERVADA con el plazo vigente (ahora 18:00, plazo 20:00)` (pasa) |
| UNIT-10 | SWR-RES-011 | `apps/api/src/reservas/verificar-cancelacion.spec.ts` | ✔ | `UNIT-10: rechaza con el plazo vencido, incluida la frontera (ahora = plazo y ahora > plazo)` (pasa) |
| UNIT-11 | SWR-RES-011 | `apps/api/src/reservas/verificar-cancelacion.spec.ts` | ✔ | `UNIT-11: rechaza si la reserva no está RESERVADA (ENTREGADA o CANCELADA) aunque el plazo esté vigente` (pasa) |
| UNIT-12 | SWR-RES-005 | `apps/api/src/reservas/cierre-sede.spec.ts` | ✔ | `UNIT-12: el cierre de una sede 24 h es null` (pasa) |
| UNIT-13 | SWR-RES-005 | `apps/api/src/reservas/cierre-sede.spec.ts` | ✔ | `UNIT-13: el cierre de una sede con horario es el del día de la reserva en hora de Bogotá` (pasa) |
| UNIT-14 | SWR-AUTH-006 | `apps/api/src/auth/auth.service.spec.ts` | ✔ | `responde igual con correo inexistente que con contraseña errada` (pasa) |
| UNIT-15 | SWR-AUTH-010 | `apps/api/src/auth/roles.guard.spec.ts` | ✔ | `permite al DUENO` (pasa)<br>`deniega al CONSUMIDOR con PROHIBIDO` (pasa)<br>`exige sesión cuando la ruta pide un rol y no hay usuario` (pasa)<br>`sin @Roles() basta con estar autenticado` (pasa) |
| UNIT-16 | SWR-SEC-002 | `apps/api/src/common/logging/redact.spec.ts` | ✔ | `oculta contraseñas, hash, tokens y Authorization y conserva el resto` (pasa)<br>`oculta también los campos sensibles anidados y en arreglos, sin importar mayúsculas` (pasa)<br>`no modifica el objeto original` (pasa) |

### 1.2 Pruebas de caja blanca (WB-01…WB-07)

| ID | SWR | Archivo previsto en la matriz | ¿Archivo real = previsto? | Pruebas que lo cubren (resultado) |
|---|---|---|---|---|
| WB-01 | SWR-RES-005 | `apps/api/src/reservas/plazo-retiro.spec.ts` | ✔ | `WB-01: limita el vencimiento sin que limite el cierre (08:00, cierre 22:00, vence 15:00 → 15:00)` (pasa) |
| WB-02 | SWR-RES-002 | `apps/api/src/reservas/verificar-reserva.spec.ts` | ✔ | `WB-02: cantidad 0 se rechaza con CANTIDAD_INVALIDA` (pasa) |
| WB-03 | SWR-RES-002 | `apps/api/src/reservas/verificar-reserva.spec.ts` | ✔ | `WB-03: una oferta CERRADA se rechaza con OFERTA_NO_ACTIVA` (pasa) |
| WB-04 | SWR-RES-002 | `apps/api/src/reservas/verificar-reserva.spec.ts` | ✔ | `WB-04: frontera, vencimiento igual a ahora se rechaza con PRODUCTO_VENCIDO` (pasa) |
| WB-05 | SWR-RES-002 | `apps/api/src/reservas/verificar-reserva.spec.ts` | ✔ | `WB-05: frontera, cantidad igual al disponible se acepta` (pasa) |
| WB-06 | SWR-OFE-003 | `apps/api/src/ofertas/validar-oferta.spec.ts` | ✔ | `WB-06: rechaza una cantidad decimal (1.5) con CANTIDAD_INVALIDA` (pasa) |
| WB-07 | SWR-RES-005 | `apps/api/src/reservas/plazo-retiro.spec.ts` | ✔ | `WB-07: sede 24 h (cierre null) no limita (07:00, vence 23:00 → 19:00)` (pasa) |

### 1.3 Casos sin prueba

**Ninguno.** Los 16 UNIT y los 7 WB tienen al menos una prueba que pasa. Observaciones sobre fidelidad respecto de la hoja «Unitarias»:

- **UNIT-08:** una sola prueba cubre las cuatro verificaciones de la hoja (hash distinto del texto, dos hashes distintos de la misma clave, `verify` correcto y con otra clave). `hashPassword` y `verifyPassword` son **asíncronas** (§2.2, D-08).
- **UNIT-14:** una sola prueba ejecuta los dos casos (correo inexistente y clave errada) y compara el cuerpo `{codigo, mensaje}`; usa `AuthService.login` con Prisma simulado, como indica la hoja.
- **UNIT-15:** cuatro pruebas (DUENO permitido, CONSUMIDOR denegado con `PROHIBIDO`, sin usuario → `NO_AUTENTICADO`, sin `@Roles()` basta con sesión). Las dos primeras son las de la hoja.
- **UNIT-16:** tres pruebas; la hoja pide una entrada con los seis campos y se cubre en la primera.
- **WB-04 / WB-05 (fronteras):** `vencimiento = ahora` se rechaza y `cantidad = disponible` se acepta, como pide el Bloque B.
- **Bloque A (5 caminos):** FF → UNIT-01, TF → UNIT-02, TT → UNIT-03, FT → WB-01, N → WB-07. La combinación «cierre nulo con vencimiento limitante» no tiene prueba propia en la matriz (lo declara la hoja «Caja blanca», pregunta 6); el código sí tiene una prueba extra de ese caso (§1.4).

### 1.4 Pruebas existentes que no corresponden a un ID de la matriz

Son pruebas añadidas por el equipo de desarrollo (DTO, servicios, middleware de logs, guard de la semilla y fronteras adicionales de las mismas funciones). No sustituyen a ninguna fila de la matriz; si se quieren incorporar, habría que darles un ID y una fila.

<details><summary><code>apps/api/src/common/logging/request-logger.middleware.spec.ts</code> — 3 prueba(s)</summary>

- RequestLoggerMiddleware › escribe una línea JSON con método, ruta plantilla, estado y duración, y sin datos sensibles
- RequestLoggerMiddleware › registra rechazos 4xx con nivel warn y el código de error
- RequestLoggerMiddleware › usa la ruta pedida cuando solo coincidió el comodín del middleware (404)

</details>

<details><summary><code>apps/api/src/ofertas/dto/oferta.dto.spec.ts</code> — 13 prueba(s)</summary>

- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › acepta un cuerpo completo, recorta el producto y convierte el vencimiento a fecha
- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › rechaza con CAMPOS_INVALIDOS: producto vacío
- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › rechaza con CAMPOS_INVALIDOS: sedeId ausente
- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › rechaza con CAMPOS_INVALIDOS: cantidad como texto
- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › rechaza con CAMPOS_INVALIDOS: precioOferta como texto
- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › rechaza con CAMPOS_INVALIDOS: precioOriginal nulo
- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › rechaza con CAMPOS_INVALIDOS: vencimiento ausente
- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › rechaza con CAMPOS_INVALIDOS: vencimiento no es una fecha
- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › rechaza con CAMPOS_INVALIDOS: precio decimal (no cabe en la columna entera)
- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › rechaza con CAMPOS_INVALIDOS: precio fuera del rango de la columna
- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › rechaza con CAMPOS_INVALIDOS: cuerpo vacío
- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › deja pasar cantidad cero, negativa o decimal y precios negativos: lo decide validarOferta / limitación conocida
- validarCuerpoOferta (forma del cuerpo de POST /ofertas) › acepta un vencimiento pasado (Decisión #6: no se valida que sea futuro)

</details>

<details><summary><code>apps/api/src/ofertas/ofertas.service.spec.ts</code> — 4 prueba(s)</summary>

- OfertasService.publicar (SWR-OFE-001, SWR-OFE-003, SWR-AUTH-010) › crea la oferta ACTIVA con disponible igual a la cantidad en una sede del usuario
- OfertasService.publicar (SWR-OFE-001, SWR-OFE-003, SWR-AUTH-010) › rechaza con PROHIBIDO una sede que no es del usuario y no crea nada
- OfertasService.publicar (SWR-OFE-001, SWR-OFE-003, SWR-AUTH-010) › rechaza con el código de validarOferta y no crea nada
- OfertasService.publicar (SWR-OFE-001, SWR-OFE-003, SWR-AUTH-010) › comprueba la sede antes que las reglas de negocio (403 antes que 400)

</details>

<details><summary><code>apps/api/src/ofertas/validar-oferta.spec.ts</code> — 2 prueba(s)</summary>

- validarOferta (SWR-OFE-003) › evalúa la cantidad antes que el precio cuando ambos fallan
- validarOferta (SWR-OFE-003) › rechaza una cantidad negativa (-1) con CANTIDAD_INVALIDA

</details>

<details><summary><code>apps/api/src/reservas/cierre-sede.spec.ts</code> — 3 prueba(s)</summary>

- calcularCierreSede (SWR-RES-005) › usa el día de la semana de Bogotá aunque en UTC ya sea el día siguiente
- calcularCierreSede (SWR-RES-005) › respeta los minutos del cierre
- calcularCierreSede (SWR-RES-005) › una sede no 24 h sin horario para ese día es un error de configuración

</details>

<details><summary><code>apps/api/src/reservas/dto/reserva.dto.spec.ts</code> — 9 prueba(s)</summary>

- validarCuerpoReserva (forma del cuerpo de POST /reservas) › acepta ofertaId y cantidad numérica
- validarCuerpoReserva (forma del cuerpo de POST /reservas) › rechaza con CAMPOS_INVALIDOS: sin cuerpo
- validarCuerpoReserva (forma del cuerpo de POST /reservas) › rechaza con CAMPOS_INVALIDOS: ofertaId ausente
- validarCuerpoReserva (forma del cuerpo de POST /reservas) › rechaza con CAMPOS_INVALIDOS: ofertaId vacío
- validarCuerpoReserva (forma del cuerpo de POST /reservas) › rechaza con CAMPOS_INVALIDOS: ofertaId numérico
- validarCuerpoReserva (forma del cuerpo de POST /reservas) › rechaza con CAMPOS_INVALIDOS: cantidad como texto
- validarCuerpoReserva (forma del cuerpo de POST /reservas) › rechaza con CAMPOS_INVALIDOS: cantidad ausente
- validarCuerpoReserva (forma del cuerpo de POST /reservas) › rechaza con CAMPOS_INVALIDOS: cantidad nula
- validarCuerpoReserva (forma del cuerpo de POST /reservas) › deja pasar 0, negativa y decimal: los rechaza verificarReserva con CANTIDAD_INVALIDA

</details>

<details><summary><code>apps/api/src/reservas/plazo-retiro.spec.ts</code> — 3 prueba(s)</summary>

- calcularPlazoRetiro (SWR-RES-005) › sede 24 h con vencimiento cercano: limita el vencimiento
- calcularPlazoRetiro (SWR-RES-005) › frontera: cierre igual al límite de 12 h (19:00 = 19:00) devuelve ese mismo instante
- calcularPlazoRetiro (SWR-RES-005) › no modifica las fechas recibidas y devuelve una fecha nueva

</details>

<details><summary><code>apps/api/src/reservas/reservas-cierre.service.spec.ts</code> — 19 prueba(s)</summary>

- ReservasService.cancelar (SWR-RES-011) › cancela, devuelve las unidades al inventario y registra el evento
- ReservasService.cancelar (SWR-RES-011) › una reserva ajena responde igual que una inexistente (404) y no toca nada
- ReservasService.cancelar (SWR-RES-011) › rechaza con RESERVA_NO_CANCELABLE si ya está ENTREGADA y no devuelve unidades
- ReservasService.cancelar (SWR-RES-011) › rechaza con RESERVA_NO_CANCELABLE si ya está CANCELADA y no devuelve unidades
- ReservasService.cancelar (SWR-RES-011) › rechaza con el plazo vencido, incluida la frontera, y no devuelve unidades
- ReservasService.cancelar (SWR-RES-011) › dos cancelaciones simultáneas de la misma reserva: una se aplica y las unidades vuelven una sola vez
- ReservasService.cancelar (SWR-RES-011) › cancelar y entregar a la vez: gana uno solo y el inventario es coherente con el resultado
- ReservasService.entregar (SWR-RES-015) › marca la reserva ENTREGADA en una sede del usuario y registra el evento con el consumidor
- ReservasService.entregar (SWR-RES-015) › una reserva de otra sede se rechaza con PROHIBIDO y no cambia de estado
- ReservasService.entregar (SWR-RES-015) › una reserva inexistente responde RESERVA_NO_ENCONTRADA
- ReservasService.entregar (SWR-RES-015) › una reserva ENTREGADA no se puede entregar (RESERVA_NO_ENTREGABLE)
- ReservasService.entregar (SWR-RES-015) › una reserva CANCELADA no se puede entregar (RESERVA_NO_ENTREGABLE)
- ReservasService.entregar (SWR-RES-015) › se puede entregar aunque el plazo ya haya vencido (no hay expiración automática en el MVP)
- ReservasService.entregar (SWR-RES-015) › dos entregas simultáneas: una se aplica y la otra recibe RESERVA_NO_ENTREGABLE
- listados de reservas (dependencia implícita d) › listarMias filtra por el consumidor
- listados de reservas (dependencia implícita d) › listarDeSede sin sedeId usa todas las sedes del usuario
- listados de reservas (dependencia implícita d) › listarDeSede con sedeId propio y estado filtra por ambos
- listados de reservas (dependencia implícita d) › listarDeSede con una sede ajena responde PROHIBIDO y no consulta reservas
- listados de reservas (dependencia implícita d) › listarDeSede de un usuario sin sedes devuelve una lista vacía sin consultar

</details>

<details><summary><code>apps/api/src/reservas/reservas.service.spec.ts</code> — 14 prueba(s)</summary>

- ReservasService.crear (SWR-RES-001, 002, 003, 005) › crea la reserva RESERVADA, descuenta el inventario con un UPDATE condicional y calcula el plazo
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › sede con horario: el cierre limita el plazo (17:00, cierre 20:00 → 20:00)
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › el vencimiento limita el plazo (10:00, vence 15:00 → 15:00)
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › rechaza (cantidad mayor al stock) con { disponible: 5 } y no toca el inventario ni crea la reserva
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › rechaza (cantidad 0) con {} y no toca el inventario ni crea la reserva
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › rechaza (cantidad decimal) con {} y no toca el inventario ni crea la reserva
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › rechaza (oferta cerrada) con { estado: 'CERRADA' } y no toca el inventario ni crea la reserva
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › rechaza (producto vencido) con { vencimiento: 2026-11-17T14:00:00.000Z } y no toca el inventario ni crea la reserva
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › oferta inexistente: OFERTA_NO_ENCONTRADA
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › consumidor que ya no existe (token de una semilla anterior): NO_AUTENTICADO, sin evento de rechazo
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › el UPDATE no actualiza ninguna fila (otro se llevó las unidades): STOCK_INSUFICIENTE y no crea la reserva
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › dos reservas simultáneas sobre la última unidad: una se crea y la otra recibe STOCK_INSUFICIENTE
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › muchas reservas simultáneas nunca superan el inventario (5 unidades, 12 intentos de 1)
- ReservasService.crear (SWR-RES-001, 002, 003, 005) › una sede no 24 h sin horario para el día es un error de configuración y no descuenta stock

</details>

<details><summary><code>apps/api/src/reservas/verificar-cancelacion.spec.ts</code> — 2 prueba(s)</summary>

- verificarCancelacion (SWR-RES-011) › una reserva EXPIRADA tampoco se puede cancelar
- verificarCancelacion (SWR-RES-011) › frontera inferior: un milisegundo antes del plazo todavía se puede cancelar

</details>

<details><summary><code>apps/api/src/reservas/verificar-reserva.spec.ts</code> — 7 prueba(s)</summary>

- verificarReserva (SWR-RES-001, SWR-RES-002) › rechaza la cantidad -1 con CANTIDAD_INVALIDA
- verificarReserva (SWR-RES-001, SWR-RES-002) › rechaza la cantidad 1.5 con CANTIDAD_INVALIDA
- verificarReserva (SWR-RES-001, SWR-RES-002) › rechaza la cantidad NaN con CANTIDAD_INVALIDA
- verificarReserva (SWR-RES-001, SWR-RES-002) › rechaza la cantidad Infinity con CANTIDAD_INVALIDA
- verificarReserva (SWR-RES-001, SWR-RES-002) › una oferta AGOTADA se rechaza con OFERTA_NO_ACTIVA
- verificarReserva (SWR-RES-001, SWR-RES-002) › una oferta ACTIVA con 0 unidades se rechaza con STOCK_INSUFICIENTE
- verificarReserva (SWR-RES-001, SWR-RES-002) › prioridad entre errores: cantidad, luego oferta no activa, luego vencido, luego stock

</details>

<details><summary><code>apps/api/src/seed/seed-guard.spec.ts</code> — 7 prueba(s)</summary>

- verificarPermisoReinicio (seed protegida) › permite el reinicio solo con SEED_ALLOW_RESET=true y SEED_PASSWORD
- verificarPermisoReinicio (seed protegida) › bloquea el reinicio si SEED_ALLOW_RESET es undefined
- verificarPermisoReinicio (seed protegida) › bloquea el reinicio si SEED_ALLOW_RESET es ""
- verificarPermisoReinicio (seed protegida) › bloquea el reinicio si SEED_ALLOW_RESET es "false"
- verificarPermisoReinicio (seed protegida) › bloquea el reinicio si SEED_ALLOW_RESET es "TRUE"
- verificarPermisoReinicio (seed protegida) › bloquea el reinicio si SEED_ALLOW_RESET es "1"
- verificarPermisoReinicio (seed protegida) › bloquea el reinicio si falta SEED_PASSWORD

</details>

## 2. API real frente a la hoja «Contrato provisional»

Fuentes: `apps/api/src/**/*.controller.ts`, `auth/dto/auth.dto.ts`, `ofertas/dto/oferta.dto.ts`, `reservas/dto/reserva.dto.ts`, servicios, `common/errores.ts` y filtros. Leyenda: ✔ coincide · ⚠ diferencia (se numera D-xx y se resume en §2.6).

### 2.1 Endpoints

Todos los errores tienen el cuerpo `{ "codigo": "...", "mensaje": "..." }`. Los endpoints con `@Roles` exigen sesión (JWT) y devuelven **401 `NO_AUTENTICADO`** sin token, con token inválido o vencido, y **403 `PROHIBIDO`** si el rol no está permitido (el rol ADMIN no puede usar ninguno de ellos).

| # | Contrato (método y ruta) | Real: controlador, acceso, entrada | Real: éxito y errores | Diferencias |
|---|---|---|---|---|
| 1 | `POST /auth/register` · Público · `{nombre, correo, contrasena}` | `auth/auth.controller.ts`, `@Public()`. `validarRegistro`: nombre y correo se recortan; el correo se guarda en **minúsculas**; los tres deben ser texto no vacío (la contraseña no se recorta). No se valida el formato del correo. | **201** `{id, nombre, correo, rol:"CONSUMIDOR"}` (sin hash). **400** `CAMPOS_INVALIDOS` (vacío, ausente, no es texto o JSON inválido). **409** `CORREO_DUPLICADO` (restricción UNIQUE del correo). | ✔ Notas: «Ana@x» y «ana@x» chocan (409); un correo sin «@» se acepta. |
| 2 | `POST /auth/login` · Público · `{correo, contrasena}` | `@Public()` + `@HttpCode(200)`. Misma validación y normalización del correo. | **200** `{accessToken, usuario:{id, nombre, rol}}`. **401** `CREDENCIALES_INVALIDAS` (mismo cuerpo para correo inexistente y clave errada). **400** `CAMPOS_INVALIDOS`. | ✔ El JWT lleva `sub` y `rol` y vence con `JWT_EXPIRES_IN` (8 h si está vacío). |
| 3 | `GET /ofertas?q=` · Público | `ofertas/ofertas.controller.ts`, `@Public()`. `q`, si es texto, se recorta y filtra con `contains` sin distinguir mayúsculas; vacío o repetido se ignora. | **200** `[Oferta]` con estado `ACTIVA`, `disponible > 0` y `vencimiento > ahora`, de la más reciente a la más antigua. Forma: `{id, sedeId, sede:{id,nombre}, producto, precioOriginal, precioOferta, cantidad, disponible, vencimiento, estado, createdAt}`. | ⚠ **D-01** la oferta incluye `sede` y `createdAt` (el contrato dice solo «[Oferta]»). ⚠ **D-02** `?q=a&q=b` (parámetro repetido) no da error: devuelve todo el listado. |
| 4 | `GET /sedes/mias` · DUENO, PERSONAL | `ofertas/sedes.controller.ts`, `@Roles('DUENO','PERSONAL')`. | **200** `[{id, nombre}]` ordenado por nombre (PERSONAL: su sede; DUENO: las de su comercio; sin sedes → `[]`). **401** `NO_AUTENTICADO` si el token es de un usuario que ya no existe. | ✔ |
| 5 | `POST /ofertas` · DUENO, PERSONAL · `{producto, precioOriginal, precioOferta, cantidad, vencimiento, sedeId}` | `@Roles('DUENO','PERSONAL')`. Orden: forma del cuerpo (`validarCuerpoOferta`) → sede del usuario → `validarOferta`. | **201** oferta (misma forma que el punto 3) con `estado:"ACTIVA"` y `disponible = cantidad`. **400** `CAMPOS_INVALIDOS`, `CANTIDAD_INVALIDA`, `PRECIO_INVALIDO`. **403** `PROHIBIDO` (rol o sede ajena). | ⚠ **D-03** `CAMPOS_INVALIDOS` cubre más que «cantidad o precios no numéricos»: producto o `sedeId` vacíos o no texto, `vencimiento` ausente o que no es fecha, precios no enteros o fuera del rango de un entero de 32 bits, cantidad con valor absoluto mayor que 2 147 483 647. ⚠ **D-04** la sede se comprueba **antes** que las reglas de negocio: una sede ajena con cantidad 0 da 403, no 400. Sin validar (limitación conocida, Bloque C): precios negativos o cero y `vencimiento` pasado se aceptan. |
| 6 | `POST /reservas` · CONSUMIDOR · `{ofertaId, cantidad}` | `reservas/reservas.controller.ts`, `@Roles('CONSUMIDOR')`. Forma: `ofertaId` texto no vacío y `cantidad` número (si no, 400). Después, una transacción: usuario → oferta → `verificarReserva` → `UPDATE ... WHERE disponible >= n` → reserva. | **201** `{id, ofertaId, oferta:{id, producto, precioOferta, sede:{id,nombre}}, cantidad, estado:"RESERVADA", plazoRetiro, createdAt}`. **400** `CAMPOS_INVALIDOS`, `CANTIDAD_INVALIDA`. **404** `OFERTA_NO_ENCONTRADA`. **409** `STOCK_INSUFICIENTE`, `OFERTA_NO_ACTIVA`, `PRODUCTO_VENCIDO`. | ⚠ **D-05** la respuesta incluye el objeto `oferta` y `createdAt` (el contrato dice solo «Reserva»). Nota de orden: una oferta inexistente con cantidad 0 da 404 (se busca la oferta antes de validar la cantidad); `cantidad` 0, negativa o decimal da 400 `CANTIDAD_INVALIDA` y un texto como cantidad da 400 `CAMPOS_INVALIDOS`. |
| 7 | `GET /reservas/mias` · CONSUMIDOR | `@Roles('CONSUMIDOR')`, ruta declarada antes de las de `:id`. | **200** `[Reserva]` propias, de la más reciente a la más antigua; misma forma que en el punto 6. | ✔ |
| 8 | `GET /reservas?sedeId=&estado=` · PERSONAL, DUENO | `@Roles('DUENO','PERSONAL')`. `sedeId` y `estado` son opcionales; `estado` ∈ {RESERVADA, ENTREGADA, CANCELADA, EXPIRADA}. | **200** `[Reserva]` de las sedes del usuario; cada una añade `consumidor:{id, nombre}`. **403** `PROHIBIDO` si `sedeId` no es del usuario. **400** `CAMPOS_INVALIDOS` por un `estado` desconocido o por un parámetro repetido. | ⚠ **D-06** el contrato la presenta con `sedeId` y `estado`, pero ambos son opcionales (sin `sedeId`: todas las sedes del usuario); `estado` inválido y parámetros repetidos dan 400 (no listado); una sede **inexistente** también da 403. Usuario sin sedes → `[]`. |
| 9 | `POST /reservas/:id/cancelar` · CONSUMIDOR dueño | `@Roles('CONSUMIDOR')` + `@HttpCode(200)`. | **200** reserva `CANCELADA` (forma del punto 6) y unidades devueltas. **404** `RESERVA_NO_ENCONTRADA` (no existe, no es del usuario o el `id` no tiene formato de UUID). **409** `RESERVA_NO_CANCELABLE` (estado distinto de RESERVADA o `ahora >= plazoRetiro`). | ✔ El cambio es un `UPDATE ... WHERE estado = 'RESERVADA'`: dos cancelaciones simultáneas dan una 200 y otra 409. |
| 10 | `PATCH /reservas/:id/entregar` · PERSONAL, DUENO | `@Roles('DUENO','PERSONAL')`. Orden: 404 → 403 → 409. | **200** reserva `ENTREGADA` con `consumidor`. **404** `RESERVA_NO_ENCONTRADA`. **403** `PROHIBIDO` (otra sede). **409** `RESERVA_NO_ENTREGABLE` (estado distinto de RESERVADA). | ✔ **D-07** (nota, no contradice el contrato): se puede entregar una reserva RESERVADA con el plazo ya vencido; el contrato no lo menciona. |

**Comportamientos del API que el contrato no lista** (aplican a todos los endpoints):

- **E-1** Rutas inexistentes responden **404** `RUTA_NO_ENCONTRADA` y los fallos inesperados **500** `ERROR_INTERNO` (por ejemplo, una sede no 24 h sin fila de horario para el día de la reserva).
- **E-2** Un cuerpo que no es JSON válido responde **400** `CAMPOS_INVALIDOS`.
- **E-3** CORS acepta solo los orígenes de `CORS_ORIGIN`.
- **E-4** Los endpoints públicos (`/auth/*` y `GET /ofertas`) ignoran un token inválido; los demás lo rechazan con 401.

### 2.2 Funciones de dominio

| Contrato | Real (archivo y firma) | Diferencias |
|---|---|---|
| `calcularPlazoRetiro(ahora, cierreSede, vencimiento)` | `reservas/plazo-retiro.ts`: `(ahora: Date, cierreSede: Date \| null, vencimiento: Date): Date`. | ✔ Devuelve una fecha nueva; no detecta un plazo anterior a `ahora` (limitación del Bloque A). |
| `calcularCierreSede(sede, horarios, ahora)` | `reservas/cierre-sede.ts`: `(sede:{abierta24h}, horarios:{diaSemana, cierre:"HH:mm"}[], ahora): Date \| null`. UTC-5 fijo (Colombia no tiene horario de verano). | ⚠ Lanza `Error` si la sede no es 24 h y no hay fila de horario para ese día de la semana; el contrato no lo dice (llega al cliente como 500 `ERROR_INTERNO`). |
| `verificarCancelacion(reserva, ahora)` | `reservas/verificar-cancelacion.ts`: devuelve `'OK'` o `'RESERVA_NO_CANCELABLE'`. | ✔ Vigente = `ahora < plazoRetiro`. |
| `verificarReserva(oferta, cantidad, ahora)` | `reservas/verificar-reserva.ts`: `'OK'` o el primer código, en el orden del contrato. | ✔ |
| `validarOferta({cantidad, precioOriginal, precioOferta})` | `ofertas/validar-oferta.ts`: `{valido:true}` o `{valido:false, codigo}`. | ✔ |
| `hashPassword / verifyPassword` | `auth/password.ts`: bcryptjs, coste 10. | ⚠ **D-08** las dos funciones devuelven una `Promise` (hay que usar `await`); el contrato no lo indica. |

### 2.3 Entidades

| Contrato | Real (`apps/api/prisma/schema.prisma`) | Diferencias |
|---|---|---|
| `Sede`: id, nombre, abierta24h | `Sede`: id, comercioId, nombre, **direccion**, abierta24h; `HorarioSede` (sedeId, diaSemana 0–6, apertura, cierre) solo para sedes no 24 h. | ✔ (campos adicionales). |
| `Oferta`: estado ACTIVA \| CERRADA \| AGOTADA; disponible entero no negativo | Además: `creadoPorId`, `createdAt`; CHECK `0 <= disponible <= cantidad`. | ✔ El estado nunca pasa a AGOTADA ni CERRADA por el código (Decisión #6): solo se usa ACTIVA. |
| `Reserva`: RESERVADA \| ENTREGADA \| CANCELADA \| EXPIRADA | Además: `plazoRetiro`, `createdAt`, `actualizadaAt`; CHECK `cantidad > 0`. | ✔ EXPIRADA existe en el enum pero nada la asigna. |
| (no figura) | `Usuario.rol`: CONSUMIDOR, PERSONAL, DUENO, **ADMIN** (solo dato sembrado). | ADMIN no puede usar ningún endpoint con `@Roles`. |

### 2.4 Rutas web frente al contrato

| Ruta del contrato | Real | Diferencias |
|---|---|---|
| `/login` · Público | `app/(auth)/login/page.tsx` + `components/LoginForm.tsx`. Con sesión redirige a `/ofertas`. `?aviso=sesion` muestra «Debes iniciar sesión». | ✔ |
| `/registro` · Público | `app/(auth)/registro/page.tsx` + `components/RegisterForm.tsx`. | ✔ Tras registrar **no** inicia sesión: muestra «Cuenta creada correctamente» y el enlace «Ir a iniciar sesión». |
| `/ofertas` · Público · `?q=` | `app/(app)/ofertas/page.tsx` + `components/ListaOfertas.tsx`. | ✔ La búsqueda actualiza `?q=` (`router.replace`). |
| `/ofertas/nueva` · DUENO, PERSONAL | `app/(app)/ofertas/nueva/page.tsx` con `RutaProtegida roles={['DUENO','PERSONAL']}`. | ✔ Sin sesión → `/login?aviso=sesion`; otro rol → «No tienes permiso para realizar esta acción» (`role="alert"`). |
| `/reservas` · CONSUMIDOR | `app/(app)/reservas/page.tsx` + `components/MisReservas.tsx`. | ✔ |
| `/gestion/reservas` · PERSONAL, DUENO | `app/(app)/gestion/reservas/page.tsx` + `components/ReservasSede.tsx`. | ✔ |
| (no figuran) | `/` redirige (307) a `/ofertas`; `not-found` para rutas desconocidas; `/icon.svg`. | Extras. |

### 2.5 Códigos de error y mensajes: código frente a «Datos y mensajes»

| Código | HTTP | Mensaje real | ¿Fila «Código de error» en la hoja? | ¿Mensaje en la hoja? |
|---|---|---|---|---|
| `CREDENCIALES_INVALIDAS` | 401 | Credenciales inválidas | **No** | Sí (categoría «Mensaje») |
| `NO_AUTENTICADO` | 401 | Debes iniciar sesión | Sí | Sí |
| `PROHIBIDO` | 403 | No tienes permiso para realizar esta acción | **No** | Sí |
| `CAMPOS_INVALIDOS` | 400 | Los datos enviados no son válidos | Sí | Sí |
| `CANTIDAD_INVALIDA` | 400 | La cantidad debe ser un número entero positivo | **No** | Sí |
| `PRECIO_INVALIDO` | 400 | El precio de oferta debe ser menor al precio original | **No** | Sí |
| `CORREO_DUPLICADO` | 409 | Ya existe una cuenta con ese correo | Sí | Sí |
| `OFERTA_NO_ENCONTRADA` | 404 | La oferta no existe | Sí | Sí |
| `RESERVA_NO_ENCONTRADA` | 404 | La reserva no existe | Sí | Sí |
| `STOCK_INSUFICIENTE` | 409 | No hay unidades suficientes | **No** | Sí |
| `OFERTA_NO_ACTIVA` | 409 | La oferta no está activa | **No** | Sí |
| `PRODUCTO_VENCIDO` | 409 | El producto está vencido | **No** | Sí |
| `RESERVA_NO_CANCELABLE` | 409 | La reserva no se puede cancelar | Sí | Sí |
| `RESERVA_NO_ENTREGABLE` | 409 | La reserva no se puede marcar como entregada | Sí | Sí |
| `RUTA_NO_ENCONTRADA` | 404 | La ruta no existe | **No** | **No** |
| `ERROR_INTERNO` | 500 | Error interno del servidor | **No** | **No** |

Siete códigos tienen su mensaje exacto en la hoja pero no el código ni el estado HTTP (`CREDENCIALES_INVALIDAS`, `PROHIBIDO`, `CANTIDAD_INVALIDA`, `PRECIO_INVALIDO`, `STOCK_INSUFICIENTE`, `OFERTA_NO_ACTIVA`, `PRODUCTO_VENCIDO`). Los siete códigos que sí figuran en la hoja coinciden **exactamente** con el código (comparados texto a texto y con su estado HTTP). `RUTA_NO_ENCONTRADA` y `ERROR_INTERNO` son de infraestructura y no aparecen en ninguna hoja.

### 2.6 Resumen de diferencias

| ID | Diferencia | Efecto sobre los casos de la matriz |
|---|---|---|
| D-01 | La oferta incluye `sede:{id,nombre}` y `createdAt`. | Ninguno; las aserciones de API-04, API-06 y RTL-08 no la excluyen. |
| D-02 | `GET /ofertas?q=a&q=b` ignora el parámetro repetido (no da error). | Ninguno. |
| D-03 | `POST /ofertas`: `CAMPOS_INVALIDOS` más amplio que el contrato. | Ninguno (API-03/04/05 usan cuerpos válidos). |
| D-04 | Orden de comprobaciones: 403 por sede antes que 400 por reglas de negocio; precios ≤ 0 y vencimiento pasado se aceptan. | Ninguno; relevante para BB-06 (los precios negativos no se prueban). |
| D-05 | `POST /reservas` y las lecturas de reservas incluyen `oferta{...}` y `createdAt`. | Ninguno; API-06 usa `createdAt` y `plazoRetiro`. |
| D-06 | `GET /reservas`: parámetros opcionales, 400 por `estado` inválido o repetido, 403 también para una sede inexistente. | Ninguno. |
| D-07 | Se puede entregar con el plazo vencido. | Ninguno. |
| D-08 | `hashPassword` y `verifyPassword` son asíncronas; `calcularCierreSede` puede lanzar un `Error`. | Ya reflejado en UNIT-08 y UNIT-12/13. |

## 3. Mensajes de la interfaz frente a «Datos y mensajes»

Se revisaron los archivos propios de FoodSave de `apps/web/src` (páginas, componentes, `config`, `lib/auth`, `lib/ofertas`, `lib/api-client.ts`) y los textos de la tabla de datos de la plantilla que se ven en las pantallas.

### 3.1 Los 19 mensajes de la hoja y dónde se producen

| Mensaje de la hoja | Lo produce | Archivo |
|---|---|---|
| Credenciales inválidas | La API (`CREDENCIALES_INVALIDAS`); la interfaz muestra `ErrorApi.message` | `components/LoginForm.tsx`, `lib/api-client.ts` |
| Cuenta creada correctamente | Interfaz (`role="status"`) | `components/RegisterForm.tsx` |
| Debes iniciar sesión | Interfaz (aviso de `/login?aviso=sesion`, `role="status"`) y API (`NO_AUTENTICADO`) | `components/LoginForm.tsx` |
| No tienes permiso para realizar esta acción | Interfaz (`RutaProtegida`, `role="alert"`) y API (`PROHIBIDO`) | `components/RutaProtegida.tsx` |
| El precio de oferta debe ser menor al precio original | Interfaz (validación) y API (`PRECIO_INVALIDO`) | `lib/ofertas/validar-formulario.ts` |
| La cantidad debe ser un número entero positivo | Interfaz (`OfertaForm` y `ReservaForm`) y API (`CANTIDAD_INVALIDA`) | `lib/ofertas/validar-formulario.ts` |
| Oferta publicada | Interfaz (`role="status"`) | `components/OfertaForm.tsx` |
| Cargando ofertas… | Interfaz (`role="status"`) | `components/ListaOfertas.tsx` |
| No hay ofertas disponibles | Interfaz | `components/ListaOfertas.tsx` |
| No se encontraron ofertas para tu búsqueda | Interfaz | `components/ListaOfertas.tsx` |
| No hay unidades suficientes | API (`STOCK_INSUFICIENTE`); se muestra como `role="alert"` | `components/ReservaForm.tsx` |
| La oferta no está activa | API (`OFERTA_NO_ACTIVA`) | `components/ReservaForm.tsx` |
| El producto está vencido | API (`PRODUCTO_VENCIDO`) | `components/ReservaForm.tsx` |
| Reserva confirmada | Interfaz (`role="status"`) | `components/ReservaForm.tsx` |
| Reserva cancelada | Interfaz (`role="status"`) | `components/MisReservas.tsx` |
| Reserva marcada como entregada | Interfaz (`role="status"`) | `components/ReservasSede.tsx` |
| El nombre es obligatorio · El correo es obligatorio · La contraseña es obligatoria | Interfaz (`RegisterForm`); `LoginForm` reutiliza los dos últimos | `components/RegisterForm.tsx`, `components/LoginForm.tsx` |

Ninguno de los 19 falta ni difiere del texto de la hoja.

### 3.2 Textos de la interfaz que no están en «Datos y mensajes»

La última columna indica si el texto ya se cita entre «…» en otra hoja de la matriz (pasos de caja negra, RTL, E2E o contrato), por lo que ya funciona como nombre estable.

#### Navegación (sidebar y cascarón)

| Texto en la interfaz | Archivo:línea | ¿Citado con «…» en otra hoja? |
|---|---|---|
| Ofertas (grupo y ítem) | `config/nav-config.ts:9` | No |
| Reservas (grupo) | `config/nav-config.ts:23` | No |
| Publicar oferta | `config/nav-config.ts:13` | No |
| Mis reservas | `config/nav-config.ts:26` | No |
| Reservas de la sede | `config/nav-config.ts:34` | No |
| Ingresar | `components/layout/app-sidebar.tsx:143` | Sí: Caja negra, RTL |
| Crear cuenta | `components/layout/app-sidebar.tsx:149` | No |
| Cerrar sesión | `components/layout/app-sidebar.tsx:195` | No |
| FoodSave, ir a las ofertas (aria-label del logo) | `components/layout/app-sidebar.tsx:51` | No |
| Saltar al contenido | `app/(app)/layout.tsx:25` | No |
| Cargando página (aria-label del esqueleto) | `components/layout/page-container.tsx:8` | No |
| Mostrar u ocultar la barra lateral (aria-label) | `components/layout/sidebar-toggle.tsx:16` | No |
| Consumidor / Personal / Dueño / Administrador (rol bajo el nombre del usuario) | `lib/auth/tipos.ts:19` | No |

#### Autenticación (/login y /registro)

| Texto en la interfaz | Archivo:línea | ¿Citado con «…» en otra hoja? |
|---|---|---|
| Iniciar sesión (título) | `app/(auth)/login/page.tsx:17` | No |
| Ingresa con tu correo y tu contraseña. | `app/(auth)/login/page.tsx:18` | No |
| ¿No tienes cuenta? · Regístrate | `app/(auth)/login/page.tsx:21` | No |
| Correo electrónico (etiqueta) | `components/LoginForm.tsx:66` | No |
| Contraseña (etiqueta) | `components/LoginForm.tsx:77` | No |
| tucorreo@ejemplo.com · Tu contraseña (placeholders) | `components/LoginForm.tsx:69` | No |
| Ingresar (botón) | `components/LoginForm.tsx:87` | Sí: Caja negra, RTL |
| Ingresando… (texto para lectores de pantalla mientras se envía) | `components/LoginForm.tsx:86` | No |
| Crea tu cuenta (título) | `app/(auth)/registro/page.tsx:11` | No |
| Regístrate como consumidor para reservar ofertas. | `app/(auth)/registro/page.tsx:12` | No |
| ¿Ya tienes cuenta? · Inicia sesión | `app/(auth)/registro/page.tsx:15` | No |
| Nombre completo (etiqueta) | `components/RegisterForm.tsx:79` | No |
| Tu nombre · Elige una contraseña (placeholders) | `components/RegisterForm.tsx:79` | No |
| Registrarse (botón) | `components/RegisterForm.tsx:107` | Sí: Caja negra, RTL |
| Creando cuenta… (lector de pantalla) | `components/RegisterForm.tsx:106` | No |
| Ya puedes iniciar sesión con tu correo y tu contraseña. | `components/RegisterForm.tsx:52` | No |
| Ir a iniciar sesión (enlace tras el registro) | `components/RegisterForm.tsx:55` | No |
| Productos próximos a vencer, con descuento. (panel de marca) | `components/auth/auth-shell.tsx:36` | No |
| Publica y reserva ofertas. Paga y recoge en la sede. (panel de marca) | `components/auth/auth-shell.tsx:39` | No |

#### Mensajes genéricos

| Texto en la interfaz | Archivo:línea | ¿Citado con «…» en otra hoja? |
|---|---|---|
| No se pudo conectar con el servidor (error de red, código solo del cliente ERROR_RED) | `lib/api-client.ts:45` | No |
| Ocurrió un error inesperado (error sin código de la API) | `components/LoginForm.tsx:37` | No |
| Página no encontrada (404 de la web) | `app/not-found.tsx:11` | No |
| La página que buscas no existe o fue movida. | `app/not-found.tsx:13` | No |
| Ver ofertas (botón/enlace de varios estados vacíos y de la 404) | `app/not-found.tsx:15` | No |

#### Ofertas (/ofertas)

| Texto en la interfaz | Archivo:línea | ¿Citado con «…» en otra hoja? |
|---|---|---|
| Ofertas (título de la página) | `app/(app)/ofertas/page.tsx:19` | No |
| Productos próximos a vencer con descuento. | `app/(app)/ofertas/page.tsx:20` | No |
| Buscar ofertas (nombre accesible del campo de búsqueda) | `components/ListaOfertas.tsx:69` | Sí: RTL |
| Buscar ofertas por nombre del producto (placeholder) | `components/ListaOfertas.tsx:70` | No |
| Buscar (botón) | `components/ListaOfertas.tsx:89` | Sí: RTL |
| Borrar búsqueda (botón con icono) | `components/ListaOfertas.tsx:80` | No |
| Reintentar (tras un error de carga; también en Mis reservas y Reservas de la sede) | `components/ListaOfertas.tsx:110` | No |
| Prueba con otra palabra o borra la búsqueda para ver todas las ofertas. | `components/ListaOfertas.tsx:125` | No |
| Vuelve más tarde: las sedes publican nuevas ofertas cada día. | `components/ListaOfertas.tsx:126` | No |
| Activa (etiqueta de la tarjeta) | `components/ListaOfertas.tsx:153` | No |
| N disponible / N disponibles (unidades en la tarjeta) | `components/ListaOfertas.tsx:174` | No |
| Vence: <fecha y hora de Bogotá> | `components/ListaOfertas.tsx:178` | No |
| -N% (descuento) y precios en formato «$ 4.000» (con espacio duro) | `components/ListaOfertas.tsx:146` | No |
| Inicia sesión para reservar (visitante) | `components/BotonReservar.tsx:37` | No |
| Publicar oferta (atajo para dueño y personal) | `components/layout/accion-publicar.tsx:9` | No |

#### Publicar oferta (/ofertas/nueva)

| Texto en la interfaz | Archivo:línea | ¿Citado con «…» en otra hoja? |
|---|---|---|
| Publicar oferta (título) · Publica un producto próximo a vencer en tu sede. | `app/(app)/ofertas/nueva/page.tsx:13` | No |
| Producto · Precio original · Precio de oferta · Cantidad · Vencimiento · Sede (etiquetas) | `components/OfertaForm.tsx:132` | No |
| Ej.: Pan integral · 8000 · 4000 · 5 (placeholders) | `components/OfertaForm.tsx:132` | No |
| En pesos colombianos · Debe ser menor al precio original · Unidades disponibles · Fecha y hora en que vence el producto (descripciones) | `components/OfertaForm.tsx:145` | No |
| Elige la sede · Cargando sedes… (placeholder del selector) | `components/OfertaForm.tsx:195` | No |
| Publicar (botón) · Publicando… (lector de pantalla) | `components/OfertaForm.tsx:203` | Sí: Caja negra, RTL |
| El producto es obligatorio | `lib/ofertas/validar-formulario.ts:26` | No |
| La sede es obligatoria | `lib/ofertas/validar-formulario.ts:27` | No |
| El precio original es obligatorio | `lib/ofertas/validar-formulario.ts:31` | No |
| El precio de oferta es obligatorio | `lib/ofertas/validar-formulario.ts:36` | No |
| El precio debe ser un número entero, en pesos | `lib/ofertas/validar-formulario.ts:33` | No |
| El vencimiento es obligatorio | `lib/ofertas/validar-formulario.ts:48` | No |
| «<producto>» ya aparece en el listado de ofertas de <sede>. (detalle del éxito) | `components/OfertaForm.tsx:51` | No |
| Ver ofertas · Publicar otra oferta (acciones tras publicar) | `components/OfertaForm.tsx:59` | No |

#### Reservar (diálogo en /ofertas)

| Texto en la interfaz | Archivo:línea | ¿Citado con «…» en otra hoja? |
|---|---|---|
| Reservar (botón de la tarjeta y botón de envío del diálogo) | `components/BotonReservar.tsx:55` | Sí: RTL |
| Reservar «<producto>» (título del diálogo) | `components/BotonReservar.tsx:58` | No |
| La reserva es inmediata. Pagas y recoges en la sede antes del plazo de retiro. | `components/BotonReservar.tsx:60` | No |
| Sede · Precio por unidad · Disponibles (resumen) | `components/ReservaForm.tsx:62` | No |
| Cantidad · Unidades que quieres reservar | `components/ReservaForm.tsx:99` | No |
| Total a pagar en la sede: $ … | `components/ReservaForm.tsx:109` | No |
| Reservando… (lector de pantalla) | `components/ReservaForm.tsx:119` | No |
| <n> × <producto> en <sede>. Plazo de retiro: <fecha>. Paga y recoge en la sede antes de ese plazo. (detalle de «Reserva confirmada») | `components/ReservaForm.tsx:73` | No |

#### Mis reservas (/reservas)

| Texto en la interfaz | Archivo:línea | ¿Citado con «…» en otra hoja? |
|---|---|---|
| Mis reservas (título) · Tus reservas y su plazo de retiro. | `app/(app)/reservas/page.tsx:12` | No |
| Cargando reservas… | `components/MisReservas.tsx:23` | No |
| Aún no tienes reservas | `components/MisReservas.tsx:98` | No |
| Reserva una oferta y aparecerá aquí con su plazo de retiro. | `components/MisReservas.tsx:99` | No |
| Producto · Cantidad · Total en sede · Estado · Plazo de retiro · Reservada el (columnas) | `components/MisReservas.tsx:172` | No |
| Reservada / Entregada / Cancelada / Expirada (etiquetas de estado) | `components/reservas/comunes.tsx:6` | No |
| Plazo vencido (reserva RESERVADA con el plazo pasado, sin botón) | `components/MisReservas.tsx:194` | No |
| Cancelar (botón de fila) | `components/MisReservas.tsx:216` | Sí: Caja negra, E2E, Contrato provisional |
| <n> × <producto>: las unidades volvieron al inventario. (detalle de «Reserva cancelada») | `components/MisReservas.tsx:47` | No |

#### Reservas de la sede (/gestion/reservas)

| Texto en la interfaz | Archivo:línea | ¿Citado con «…» en otra hoja? |
|---|---|---|
| Reservas de la sede (título) · Reservas de tu sede para entregar al cliente. | `app/(app)/gestion/reservas/page.tsx:13` | No |
| Cargando reservas… | `components/ReservasSede.tsx:22` | No |
| No hay reservas en tu sede | `components/ReservasSede.tsx:120` | No |
| Cuando un consumidor reserve una oferta, aparecerá aquí para entregarla. | `components/ReservasSede.tsx:121` | No |
| Producto · Consumidor · Sede (solo con varias sedes) · Cantidad · Total a cobrar · Estado · Plazo de retiro (columnas) | `components/ReservasSede.tsx:209` | No |
| Marcar entregada (botón de fila) | `components/ReservasSede.tsx:244` | Sí: Caja negra, Contrato provisional |
| <n> × <producto> para <consumidor>. (detalle de «Reserva marcada como entregada») | `components/ReservasSede.tsx:47` | No |

#### Tabla de datos (plantilla traducida)

| Texto en la interfaz | Archivo:línea | ¿Citado con «…» en otra hoja? |
|---|---|---|
| Buscar por producto… (filtro de texto) | `components/MisReservas.tsx:159` | No |
| Estado · Sede (filtros de la barra de herramientas) | `components/MisReservas.tsx:179` | No |
| Ver · Ver columnas · Columnas · Buscar columnas… · No se encontraron columnas. | `components/data-table/data-table-view-options.tsx:58` | No |
| Filas por página · Página N de M · Ir a la primera/anterior/siguiente/última página | `components/data-table/data-table-pagination.tsx:116` | No |
| No se encontraron resultados. (tabla sin filas por un filtro) | `components/data-table/data-table.tsx:190` | No |
| Restablecer (filtros) · Limpiar filtros · Asc · Desc · Ocultar | `components/data-table/data-table-toolbar.tsx:51` | No |


### 3.3 Observaciones sobre los textos

- **Mayúsculas y formato:** la etiqueta «Activa» (la matriz BB-05 dice «estado activa»), los precios como `$ 4.000` con **espacio duro** (U+00A0) entre `$` y la cifra, «N disponibles» (RTL-08 dice «unidades disponibles») y las fechas en `es-CO`, zona `America/Bogota`, p. ej. «18/11/2026, 11:20 a. m.».
- **Nombres repetidos:** «Reservar» es a la vez el botón de la tarjeta y el de envío del diálogo; «Ver ofertas» aparece en varios estados; `role="status"` aparece también como texto oculto del botón de carga (`LoadingButton`). Los localizadores deben acotar por contenedor o por texto (§4 y §5).
- **Nombres de menú y de ruta citados sin comillas:** «Mis reservas» y «Reservas de la sede» aparecen en el Contrato (rutas web) sin comillas, por eso la última columna dice «No»; son los títulos de página y los ítems del menú.
- **Modo desarrollo:** el indicador `N` de Next solo existe en desarrollo; no forma parte de la interfaz de FoodSave.

## 4. Componentes candidatos a RTL-01 … RTL-12

### 4.1 Infraestructura web existente

- `apps/web/vitest.config.ts`: entorno `jsdom`, `globals: true`, alias `@` → `src`, `include: ['src/**/*.test.{ts,tsx}']` (coincide con las rutas previstas `apps/web/src/components/*.test.tsx`), `passWithNoTests: true`.
- `apps/web/vitest.setup.ts`: `@testing-library/jest-dom/vitest` y stubs de `ResizeObserver`, `scrollIntoView` y `getAnimations`.
- Dependencias instaladas: `vitest`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@vitejs/plugin-react`.
- **Pruebas web existentes: 0** (`npm test -w apps/web` pasa por `passWithNoTests`).

Módulos que las pruebas deben simular (rutas de importación reales): `@/lib/api/auth` (`login`, `registrar`), `@/lib/api/ofertas` (`listarOfertas`, `publicarOferta`, `listarMisSedes`), `@/lib/api/reservas` (`crearReserva`, y las de «Mis reservas»), `next/navigation` (`useRouter` → `push`, `replace`) y `next/link`. El error de la API es la clase `ErrorApi(codigo, mensaje, estado)` de `@/lib/api-client`.

### 4.2 Candidatos

| ID | Componente | Archivo fuente | Archivo de prueba previsto (no existe) | Proveedores | Simulaciones | Localizadores y aserciones estables | Riesgos |
|---|---|---|---|---|---|---|---|
| RTL-01 | `RegisterForm` | `apps/web/src/components/RegisterForm.tsx` | `apps/web/src/components/RegisterForm.test.tsx` | Ninguno | `registrar` | `getByRole('button', {name:'Registrarse'})`; textos «El nombre es obligatorio», «El correo es obligatorio», «La contraseña es obligatoria» (`role="alert"` por campo); `registrar` no se llama. | Los mensajes salen **tras** el envío, no antes. |
| RTL-02 | `RegisterForm` | ídem | ídem | Ninguno | `registrar` → 201 | `getByLabelText('Nombre completo')`, `getByLabelText('Correo electrónico')`, `getByLabelText('Contraseña')`; llamada con `{nombre, correo, contrasena}` (el nombre y el correo se recortan); «Cuenta creada correctamente» dentro de un `role="status"`. | Tras el éxito el formulario se reemplaza por el panel de éxito (no queda el botón). |
| RTL-03 | `LoginForm` | `apps/web/src/components/LoginForm.tsx` (prop opcional `aviso`) | `apps/web/src/components/LoginForm.test.tsx` | `QueryClientProvider` + `AuthProvider` (`@/lib/auth/auth-context`; `AuthProvider` usa `useQueryClient`) | `login` → `{accessToken, usuario:{id,nombre,rol}}`; `useRouter().push` | Etiquetas «Correo electrónico» y «Contraseña»; botón «Ingresar»; `push` con `'/ofertas'`; la sesión queda en `localStorage['foodsave.sesion']`. | El mock debe devolver también `usuario`: sin él la sesión guardada es inválida al releerla. Limpiar `localStorage` entre pruebas. |
| RTL-04 | `LoginForm` | ídem | ídem | ídem | `login` rechaza `ErrorApi('CREDENCIALES_INVALIDAS','Credenciales inválidas',401)` | `getByRole('alert')` con «Credenciales inválidas»; `push` no se llama; `localStorage` sin sesión. | Candidata a explicar línea por línea. Con los campos vacíos hay además alertas por campo. |
| RTL-05 | `RutaProtegida` | `apps/web/src/components/RutaProtegida.tsx` | `apps/web/src/components/RutaProtegida.test.tsx` | `QueryClientProvider` + `AuthProvider` | `useRouter().replace`; sesión simulada con rol CONSUMIDOR escribiendo `localStorage['foodsave.sesion']` antes del render (o simulando `useAuth`) | `findByRole('alert')` con «No tienes permiso para realizar esta acción»; el hijo no se renderiza; `replace` no se llama. | Mientras carga la sesión se muestra un `role="status"` vacío; esperar con `findBy…`. Sin sesión: `replace('/login?aviso=sesion')`. |
| RTL-06 | `ListaOfertas` | `apps/web/src/components/ListaOfertas.tsx` (prop `qInicial`) | `apps/web/src/components/ListaOfertas.test.tsx` | `QueryClientProvider` (`retry:false`) + **`AuthProvider`** (porque `BotonReservar` usa `useAuth`) | `listarOfertas` con promesa pendiente; `useRouter`; `next/link` | `getByRole('status')` con «Cargando ofertas…». | Hay un único `role="status"` mientras carga. |
| RTL-07 | `ListaOfertas` | ídem | ídem | ídem | `listarOfertas` → `[]` | `findByText('No hay ofertas disponibles')`. | |
| RTL-08 | `ListaOfertas` | ídem | ídem | ídem | `listarOfertas` → dos ofertas con la forma completa (`sede:{id,nombre}`, `vencimiento` ISO, etc.) | Nombres «Pan integral» y «Tajada de torta»; `getByText('5 disponibles')`; precios con expresión regular `/\$\s?4\.000/` (espacio duro). | El `Reservar` de cada tarjeta depende de la sesión (visitante: «Inicia sesión para reservar»). |
| RTL-09 | `ListaOfertas` | ídem | ídem | ídem | `listarOfertas` espía | `getByRole('searchbox', {name:'Buscar ofertas'})` + `getByRole('button', {name:'Buscar'})`; `listarOfertas` llamada con el texto `'pan'` (argumento posicional, no objeto); `router.replace('/ofertas?q=pan', {scroll:false})`. | «Buscar» no coincide con «Borrar búsqueda» (nombre exacto). |
| RTL-10 | `OfertaForm` | `apps/web/src/components/OfertaForm.tsx` | `apps/web/src/components/OfertaForm.test.tsx` | `QueryClientProvider` | `listarMisSedes`, `publicarOferta` (espía) | Etiquetas «Precio original», «Precio de oferta», «Cantidad»; botón «Publicar»; «El precio de oferta debe ser menor al precio original»; `publicarOferta` no se llama. | Candidata a explicar. El error de precio sale aunque falten producto, vencimiento y sede (cada campo se valida por separado en cada envío). |
| RTL-11 | `ReservaForm` | `apps/web/src/components/ReservaForm.tsx` (props: `oferta`, `disponible?`, `onReservada?`) | `apps/web/src/components/ReservaForm.test.tsx` | Ninguno | `crearReserva` → `ErrorApi('STOCK_INSUFICIENTE','No hay unidades suficientes',409)` | Etiqueta «Cantidad»; botón «Reservar»; `getByRole('alert')` con «No hay unidades suficientes»; `queryByText('Reserva confirmada')` es nulo. | Pasar un `oferta` completo (`id`, `producto`, `precioOferta`, `disponible`, `sede.nombre`). |
| RTL-12 | `ReservaForm` | ídem | ídem | Ninguno | `crearReserva` con una promesa que se resuelve a mano (`plazoRetiro` ISO) | `getByRole('button', {name:'Reservar'})` `toBeDisabled()` mientras se envía; luego «Reserva confirmada» dentro de un `role="status"` que contiene «Plazo de retiro:»; el botón vuelve a estar habilitado. | Candidata a explicar. Hay **dos** `role="status"` (la confirmación y el texto oculto del botón de carga): filtrar por texto, no usar `getByRole('status')` a secas. |

Otros componentes con comportamiento propio y sin fila en la matriz: `BotonReservar` (visitante, rol y diálogo), `MisReservas` y `ReservasSede` (usan `DataTable` con `nuqs`; para probarlas hace falta `NuqsTestingAdapter` de `nuqs/adapters/testing`).

## 5. Localizadores y textos estables para los 5 casos E2E

### 5.1 Entorno y datos

- **No existen** `e2e/`, `playwright.config`, `@playwright/test` ni el workspace `e2e` (el `package.json` raíz solo declara `apps/*`). Rutas previstas por la matriz: `e2e/tests/flujo-principal.spec.ts`, `flujo-cancelacion.spec.ts`, `registro.spec.ts`, `seguridad.spec.ts`, `oferta-validacion.spec.ts`.
- **URLs:** web en `http://localhost:3000` (`npm run dev -w apps/web`); API en el puerto de `PORT` (3001 por defecto) (`npm run dev:api`). La web llama a la API con `NEXT_PUBLIC_API_URL` y la API solo acepta el origen de `CORS_ORIGIN`. No imprimir ni versionar valores del `.env`.
- **Semilla:** `npm run seed:test` (deja usuarios, comercio y sedes **sin ofertas**; exige `SEED_ALLOW_RESET=true`). La contraseña de las cuentas es `SEED_PASSWORD` (variable de entorno; no se escribe en el repositorio).
- **Cuentas** (nombre que se ve en la interfaz): `dueno@foodsave.test` (Dueño Demo, 2 sedes), `personal@foodsave.test` (Personal Demo, Sede Centro), `consumidor1@foodsave.test` (Consumidor Uno), `consumidor2@foodsave.test` (Consumidor Dos).
- **Sedes:** «Sede Centro» (24 h; el plazo de retiro no depende de la hora) y «Sede Norte» (cierra a las 20:00).
- **Sesión:** vive en `localStorage['foodsave.sesion']` como `{accessToken, usuario:{id,nombre,rol}}`; cada contexto de navegador de Playwright tiene la suya (tres contextos para E2E-01). Cerrar sesión solo borra ese valor.
- **Datos independientes:** nombre de producto `E2E <Date.now()>` y correo `e2e-<Date.now()>@foodsave.test`. Con la semilla `seed:test` no hay otras ofertas, pero «Reservas de la sede» acumula reservas de ejecuciones anteriores: filtrar siempre por el nombre único.

### 5.2 Catálogo de localizadores por pantalla

| Pantalla | Elemento | Localizador recomendado | Notas |
|---|---|---|---|
| `/login` | Correo, contraseña | `getByLabel('Correo electrónico')`, `getByLabel('Contraseña')` | |
| `/login` | Enviar | `getByRole('button', {name:'Ingresar'})` | En `/login` no hay barra lateral (no hay otro «Ingresar»). |
| `/login` | Error de credenciales | `getByRole('alert')` con texto «Credenciales inválidas» | Mismo texto con correo inexistente y con clave errada. |
| `/login?aviso=sesion` | Aviso | `getByText('Debes iniciar sesión')` | Es un `role="status"`. |
| `/registro` | Campos y envío | `getByLabel('Nombre completo')`, `getByLabel('Correo electrónico')`, `getByLabel('Contraseña')`, `getByRole('button', {name:'Registrarse'})` | |
| `/registro` | Éxito | `getByText('Cuenta creada correctamente')`; `getByRole('link', {name:'Ir a iniciar sesión'})` | |
| Barra lateral | Usuario conectado | `getByText('Consumidor Uno')` (nombre) y el rol debajo | Aparece tras cargar la sesión. |
| `/ofertas` | Búsqueda | `getByRole('searchbox', {name:'Buscar ofertas'})`, `getByRole('button', {name:'Buscar'})` | La URL pasa a `/ofertas?q=<texto>`. |
| `/ofertas` | Tarjeta de una oferta | `getByRole('listitem').filter({hasText: nombre})` | Contiene el precio (`$ 4.000`), «N disponibles» y «Activa». |
| `/ofertas` | Reservar | `tarjeta.getByRole('button', {name:'Reservar'})` | Solo con sesión de consumidor. |
| Diálogo de reserva | Cantidad y envío | `getByRole('dialog')` → `getByLabel('Cantidad')`, `getByRole('button', {name:'Reservar'})` | Acotar siempre al `dialog`: la tarjeta de la oferta también tiene un botón «Reservar». |
| Diálogo de reserva | Confirmación y cierre | `getByText('Reserva confirmada')`, `getByText(/Plazo de retiro:/)`, `getByRole('button', {name:'Cerrar'})` | El listado se refresca **al cerrar**. |
| `/ofertas/nueva` | Campos | `getByLabel('Producto')`, `getByLabel('Precio original')`, `getByLabel('Precio de oferta')`, `getByLabel('Cantidad')`, `getByLabel('Vencimiento')` | `Vencimiento` es `datetime-local`: `fill('2030-01-01T12:00')` (hora local del navegador). |
| `/ofertas/nueva` | Sede | `getByRole('combobox')` y luego `getByRole('option', {name:'Sede Centro'})` | El dueño debe elegir (2 sedes); el personal la trae elegida. El texto del selector muestra el nombre de la sede. |
| `/ofertas/nueva` | Publicar y resultados | `getByRole('button', {name:'Publicar'})`; `getByText('Oferta publicada')`; `getByText('El precio de oferta debe ser menor al precio original')` | Tras publicar aparecen «Ver ofertas» y «Publicar otra oferta». |
| `/reservas` | Tabla y fila | `getByRole('table')`; `getByRole('row').filter({hasText: nombre})` | Columnas: Producto, Cantidad, Total en sede, Estado, Plazo de retiro, Reservada el. |
| `/reservas` | Cancelar y resultado | `fila.getByRole('button', {name:'Cancelar'})`; `getByText('Reserva cancelada')`; `fila.getByText('Cancelada')` | La fila cancelada pierde el botón. |
| `/gestion/reservas` | Entregar y resultado | `fila.getByRole('button', {name:'Marcar entregada'})`; `getByText('Reserva marcada como entregada')`; `fila.getByText('Entregada')` | La fila de la tabla incluye el consumidor («Consumidor Uno»). |
| Rutas protegidas | Sin permiso | `getByRole('alert')` con «No tienes permiso para realizar esta acción» | Sin sesión: `toHaveURL(/\/login\?aviso=sesion/)`. |

### 5.3 Pasos de cada caso y localizadores

**E2E-01 · Flujo principal (tres contextos: dueño, consumidor, personal)**

| Paso (matriz) | Acciones y localizadores | Aserciones |
|---|---|---|
| 1. Dueño publica (cantidad 5, «Sede Centro») | `/login` → campos → «Ingresar» → `/ofertas/nueva` → Producto = `E2E <ts>`, Precio original 8000, Precio de oferta 4000, Cantidad 5, Vencimiento a 2 días, Sede → `combobox` → `option` «Sede Centro» → «Publicar». | `getByText('Oferta publicada')`. |
| 2. Consumidor busca y reserva 2 | Nuevo contexto → login → `/ofertas` → `searchbox` con el nombre → «Buscar» → tarjeta → «Reservar» → diálogo → Cantidad 2 → «Reservar». | La tarjeta aparece con «5 disponibles». |
| 3. Consumidor ve la confirmación | — | `getByText('Reserva confirmada')` y `getByText(/Plazo de retiro:/)`; al cerrar el diálogo la tarjeta muestra **«3 disponibles»**. |
| 4. Personal entrega | Tercer contexto → login → `/gestion/reservas` → fila con el nombre → «Marcar entregada». | `getByText('Reserva marcada como entregada')`; la fila pasa a «Entregada». Opcional: en `/reservas` del consumidor la fila es «Entregada» sin «Cancelar». |

**E2E-02 · Flujo alterno: reservar y cancelar**

| Paso | Acciones y localizadores | Aserciones |
|---|---|---|
| Preparación (`beforeAll`, por API) | `POST /auth/login` (dueño), `GET /sedes/mias` (buscar «Sede Centro»), `POST /ofertas` con cantidad 5. | Oferta creada con `disponible = 5`. |
| 1–2. Login y reserva de 2 | Consumidor1 → login → `/ofertas` → búsqueda → «Reservar» → 2. | «Reserva confirmada». |
| 3. Cancelar | `/reservas` → fila con el nombre → «Cancelar». | `getByText('Reserva cancelada')`; fila «Cancelada» sin botón. |
| 4. Volver a `/ofertas` | `page.goto('/ofertas')` + búsqueda. | La tarjeta muestra **«5 disponibles»**. |

**E2E-03 · Registro y primer inicio de sesión**

| Paso | Acciones y localizadores | Aserciones |
|---|---|---|
| 1–2. Registro | `/registro` → Nombre completo, Correo (`e2e-<ts>@foodsave.test`), Contraseña → «Registrarse». | `getByText('Cuenta creada correctamente')`. |
| 3. Primer ingreso | «Ir a iniciar sesión» → login con la cuenta nueva. | `toHaveURL('/ofertas')` y el nombre del usuario en la barra lateral. |

**E2E-04 · Login inválido y ruta protegida**

| Paso | Acciones y localizadores | Aserciones |
|---|---|---|
| 1. Contraseña errada | `/login` → correo existente + clave errada → «Ingresar». | `getByRole('alert')` con «Credenciales inválidas»; la URL sigue en `/login`. |
| 2. Ruta protegida sin sesión | Contexto limpio → `/gestion/reservas`. | `toHaveURL(/\/login\?aviso=sesion/)` y `getByText('Debes iniciar sesión')`. |

**E2E-05 · Publicar con precio inválido y corregirlo**

| Paso | Acciones y localizadores | Aserciones |
|---|---|---|
| 1. Precio de oferta = original | Dueño → `/ofertas/nueva` → Sede «Sede Centro» → Precio original 8000, Precio de oferta 8000 → «Publicar». | `getByText('El precio de oferta debe ser menor al precio original')`; no hay «Oferta publicada». |
| 2–3. Corregir y publicar | `fill` del Precio de oferta con 4000 → «Publicar». | `getByText('Oferta publicada')`; en `/ofertas` la oferta aparece (búsqueda por su nombre). |

### 5.4 Riesgos de estabilidad

1. **Dos `role="status"` a la vez** (confirmación y texto oculto del botón de carga): localizar por texto, no por rol solo.
2. **«Reservar» duplicado** entre la tarjeta y el diálogo y varios «Ver ofertas»: acotar por tarjeta (`listitem`), por `dialog` o por fila.
3. **Selector de sede (Base UI):** el menú se abre en un portal; esperar `option` antes de hacer clic.
4. **Fecha:** `datetime-local` usa la hora local del navegador; fijar la zona horaria del contexto (`America/Bogota`) o usar una fecha lejana.
5. **Espacio duro** en los precios: comparar con expresión regular, no con la cadena exacta.
6. **Actualización del listado:** se refresca al cerrar el diálogo (no al reservar) y las consultas se consideran vigentes 5 s; para verificar «3 disponibles» o «5 disponibles» cerrar el diálogo o recargar con `page.goto`.
7. **Tabla con estado en la URL** (`page`, `perPage`, `sort`, filtros): no reutilizar URLs con parámetros de otra prueba.
8. **Arranque:** web y API deben estar levantadas y con la base reiniciada (`seed:test`) antes de cada ejecución; sin la semilla, «Reservas de la sede» mezcla reservas anteriores.
9. **Modo desarrollo:** aparece el indicador `N` de Next; no usar localizadores de posición ni capturas completas como aserción.

## 6. Hallazgos y decisiones para la Etapa 8

1. **Contrato (D-01…D-08).** Decidir si se actualiza la hoja «Contrato provisional» con los campos adicionales de las respuestas, el 400 por `estado` o parámetro repetido, y los comportamientos E-1…E-4 (código y matriz deben coincidir; ninguna diferencia obliga a cambiar los casos API).
2. **«Datos y mensajes».** Añadir los 7 códigos que solo figuran como mensaje y los 2 de infraestructura (`RUTA_NO_ENCONTRADA`, `ERROR_INTERNO`), y valorar incorporar los textos de la interfaz ya citados en otras hojas («Ingresar», «Registrarse», «Buscar ofertas», «Buscar», «Publicar», «Reservar», «Cancelar», «Marcar entregada») como nombres estables.
3. **Estado de la matriz.** Con 114 de 114 pruebas Jest pasando, las 23 filas UNIT/WB ya pueden pasar de «Pendiente» a «PASS» (decisión del equipo; hoy no se tocó el libro).
4. **Carpetas que faltan:** `e2e/` (con `@playwright/test`, `playwright.config` y el workspace) y `postman/` (colección y environment sin secretos). Las rutas previstas por la matriz no existen aún.
5. **Pruebas RTL:** ninguna existe; los 6 componentes están listos. Decidir si se crea un auxiliar compartido de render (proveedores + `localStorage` + mocks de `next/navigation`).
6. **Comportamientos conocidos que las pruebas deben tener en cuenta** (aceptados en el alcance; candidatos a hallazgos de la Etapa 9): precios negativos o cero y `vencimiento` pasado se aceptan al publicar; una reserva hecha con la sede ya cerrada nace con el plazo vencido (no se puede cancelar); se puede entregar con el plazo vencido; no hay expiración automática ni cierre automático de ofertas.
7. **Precondiciones de la matriz frente a la semilla:** `seed:test` deja el sistema sin ofertas (BB-05, BB-07, E2E-01/02/05 las crean); `seed` (demo) crea «Pan integral» y «Tajada de torta» con vencimiento a 3 días.

## Anexo · Cómo se generó este documento

- **Matriz:** lectura de las 12 hojas con `openpyxl` (solo lectura).
- **UNIT/WB:** `npx jest --json --outputFile=<fuera del repo>` en `apps/api` y búsqueda de cada ID en los títulos de las pruebas.
- **API:** lectura de controladores, DTO, servicios y `common/errores.ts`; comparación de códigos, estados y mensajes con la hoja «Datos y mensajes» por script.
- **Interfaz:** extracción de textos de los archivos propios de `apps/web/src` y resolución del número de línea de cada uno; comparación con las hojas de la matriz.
- **Sin cambios:** no se modificó código, la matriz ni la base de datos; el único archivo añadido es este.
