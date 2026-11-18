# Plan de desarrollo FoodSave MVP — versión aprobada (v2)

Plan aprobado por el equipo. Complemento: [componentes_plantilla.md](componentes_plantilla.md) (qué se reutiliza y descarta de la plantilla visual). Los cambios al contrato y a la matriz de pruebas están en la sección 10; los aplicó el equipo a los `.xlsx`, `CLAUDE.md`, `SWR_seleccionados.md` y `Log_Cambios_SRS.md` fuera de la sesión de Claude Code (paso 0b del orden de desarrollo; ver la nota final).

Fuentes leídas: `SWR_seleccionados.md`, `01_Alcance_y_Trazabilidad.xlsx`, `04_Matriz_Pruebas.xlsx` (todas las hojas de diseño), `Log_Cambios_SRS.md`, `CLAUDE.md`. El PDF 06 no se usa: ya verificaste sus criterios.

## 0. Trazabilidad y alcance
15 SWR, 4 módulos (auth base + 3 funcionales). Cadenas SYS→STK→BR: AUTH-001/005/006/010 y SEC-002 → STK-GEN-03 → BR-03; OFE-001/003 → STK-PER-01/DUE-03 → BR-01; BUS-001/005 → STK-CON-01/02 → BR-01; RES-001/002/003/005 → STK-CON-03 → BR-02 (002/003 también BR-01); RES-011 → STK-CON-05 → BR-05; RES-015 → STK-PER-02 → BR-02/BR-03. BR-04 no se cubre (declarado). **Nada fuera de los 15.** Dependencias implícitas: (a) correo único, (b) plazo en la confirmación, (c) campos obligatorios de la oferta, (d) listados mínimos de reservas, y **(e) nueva: `GET /sedes/mias`** (necesaria para OFE-001 y RES-015; se registra en «Decisiones» #5).

## 1. Estructura del monorepo (npm workspaces)
```
foodsave-mvp/
├─ package.json            # workspaces: apps/*, e2e ; scripts npm: dev, build, test, seed, seed:test
├─ package-lock.json       # (sin bun.lock, sin bunfig, sin Dockerfile.bun)
├─ .env.example            # versionado, sin valores
├─ apps/
│  ├─ api/                 # NestJS + Prisma
│  │  ├─ prisma/{schema.prisma, migrations/, seed.ts}
│  │  └─ src/
│  │     ├─ main.ts, app.module.ts
│  │     ├─ common/{logging/(request-logger.interceptor.ts, event-logger.service.ts, redact.ts),
│  │     │          errores.ts (códigos + mensajes exactos), filters/http-exception.filter.ts}
│  │     ├─ prisma/{prisma.module.ts, prisma.service.ts}
│  │     ├─ auth/{auth.module/controller/service, password.ts, jwt.guard.ts, roles.guard.ts, roles.decorator.ts, dto/}
│  │     ├─ ofertas/{ofertas.module/controller/service, sedes.controller.ts, validar-oferta.ts, dto/}
│  │     └─ reservas/{reservas.module/controller/service, plazo-retiro.ts, cierre-sede.ts,
│  │                  verificar-reserva.ts, verificar-cancelacion.ts, dto/}   # *.spec.ts junto a cada archivo
│  └─ web/                 # Next.js (plantilla adaptada)
├─ e2e/                    # Playwright: tests/*.spec.ts (Etapa 8)
└─ docs/…                  # existente
```
Módulos Nest: **solo Auth, Ofertas y Reservas** (+ Prisma y Common). La consulta pública vive en `ofertas` (`GET /ofertas`, así lo define el contrato) y `GET /sedes/mias` también (`sedes.controller.ts` dentro de `ofertas`, sin crear un cuarto módulo de «sedes»). No hay módulos de comercios ni categorías (semillas).

## 2. Modelo de datos Prisma (PostgreSQL / Supabase)
Enums: `Rol {CONSUMIDOR, PERSONAL, DUENO, ADMIN}` (ADMIN solo dato), `EstadoOferta {ACTIVA, CERRADA, AGOTADA}`, `EstadoReserva {RESERVADA, ENTREGADA, CANCELADA, EXPIRADA}` (EXPIRADA sin uso en el MVP).

| Entidad | Campos | Relaciones / restricciones |
|---|---|---|
| Usuario | id (uuid), nombre, correo, passwordHash, rol, sedeId? (solo PERSONAL), comercioId? (solo DUENO), createdAt | **`correo` UNIQUE** (se guarda normalizado en minúsculas); PERSONAL→Sede; DUENO→Comercio |
| Comercio | id, nombre, estado (APROBADO) | solo semilla; 1—N Sede |
| Sede | id, comercioId, nombre, direccion, **`abierta24h` Boolean (default false)** | solo semilla; 1—N HorarioSede, 1—N Oferta |
| HorarioSede | id, sedeId, diaSemana (0–6), apertura, cierre | UNIQUE(sedeId, diaSemana). Solo se usa si `abierta24h = false`; las sedes 24 h **no necesitan filas** porque el campo explícito manda |
| Oferta | id, sedeId, producto, precioOriginal (Int COP), precioOferta (Int), cantidad (Int), disponible (Int), vencimiento (DateTime UTC), estado, creadoPorId, createdAt | CHECK `disponible >= 0`, `disponible <= cantidad`; índice de búsqueda por producto. **No** se añaden CHECK de `cantidad > 0` ni de precios en la BD: la regla vive en `validarOferta` y los valores negativos/cero son limitación conocida (ver C9) |
| Reserva | id, ofertaId, consumidorId, cantidad, estado, plazoRetiro, createdAt, actualizadaAt | índices por consumidorId y por (ofertaId, estado) |
| Categoría | — | No se modela (D8) |

Zona horaria `America/Bogota` para interpretar el horario de cierre del día; fechas en UTC en BD (D6).

## 3. Backend NestJS: módulos, endpoints y dominio (Contrato provisional + cambios de §10)
**Auth** (`/auth`)
- `POST /auth/register` {nombre, correo, contrasena} → 201 {id, nombre, correo, rol:CONSUMIDOR}; **solo exige que nombre, correo y contraseña no estén vacíos** (sin longitud mínima ni política); 409 `CORREO_DUPLICADO`; 400 `CAMPOS_INVALIDOS`. SWR AUTH-001, SEC-002 (+ dep. a).
- `POST /auth/login` → 200 {accessToken, usuario:{id,nombre,rol}}; 401 `CREDENCIALES_INVALIDAS` idéntico para correo inexistente o clave errada (se compara contra un hash ficticio para igualar tiempos). SWR AUTH-005, AUTH-006.
- `JwtAuthGuard` + `RolesGuard` (`@Roles()`): 401 `NO_AUTENTICADO`, 403 `PROHIBIDO`; JWT con `JWT_SECRET` y `JWT_EXPIRES_IN`. SWR AUTH-010 (rol + sede asignada, Decisión #3).
- Dominio: `hashPassword`/`verifyPassword` con **bcryptjs**, coste 10. SWR SEC-002.

**Ofertas** (`/ofertas`, `/sedes`)
- `GET /ofertas?q=` público → [Oferta] con `estado = ACTIVA AND disponible > 0 AND vencimiento > ahora`, búsqueda parcial sin distinguir mayúsculas (`contains`, `mode:'insensitive'`). SWR BUS-001, BUS-005.
- `POST /ofertas` DUENO/PERSONAL → 201 ACTIVA con `disponible = cantidad`; 400 `CANTIDAD_INVALIDA | PRECIO_INVALIDO`; 400 `CAMPOS_INVALIDOS` si cantidad/precios **no son números** (única validación del DTO sobre estos campos; **no** se rechazan negativos ni cero en el DTO: limitación conocida del Bloque C, hallazgo candidato); la `sedeId` debe ser la del PERSONAL o una del comercio del DUENO (si no, 403 `PROHIBIDO`). SWR OFE-001, OFE-003, AUTH-010.
- `GET /sedes/mias` DUENO/PERSONAL → [{id, nombre}] (PERSONAL: su sede; DUENO: las de su comercio). Dependencia implícita (e) de OFE-001 y RES-015.
- Dominio: `validarOferta({cantidad, precioOriginal, precioOferta})` → `{valido:true}` | `{valido:false, codigo}` (orden: cantidad, luego precio). SWR OFE-003.

**Reservas** (`/reservas`)
- `POST /reservas` CONSUMIDOR {ofertaId, cantidad} → **una transacción Prisma**: leer oferta (404 `OFERTA_NO_ENCONTRADA`), `verificarReserva`, `calcularCierreSede` + `calcularPlazoRetiro`, `UPDATE oferta SET disponible = disponible - n WHERE id = … AND disponible >= n` (0 filas → `STOCK_INSUFICIENTE`) y creación de la reserva RESERVADA. 201 / 400 `CANTIDAD_INVALIDA` / 400 `CAMPOS_INVALIDOS` (cantidad u ofertaId no válidos en tipo) / 409 `STOCK_INSUFICIENTE | OFERTA_NO_ACTIVA | PRODUCTO_VENCIDO`. SWR RES-001/002/003/005.
- `GET /reservas/mias` CONSUMIDOR → [Reserva] propias (dep. d).
- `GET /reservas?sedeId=&estado=` PERSONAL/DUENO de esa sede; sede ajena → 403 `PROHIBIDO` (dep. d).
- `POST /reservas/:id/cancelar` CONSUMIDOR propietario → `verificarCancelacion`; transacción: estado CANCELADA + `disponible += cantidad`. 200 / 404 `RESERVA_NO_ENCONTRADA` (no existe **o no es suya**) / 409 `RESERVA_NO_CANCELABLE`. SWR RES-011.
- `PATCH /reservas/:id/entregar` PERSONAL/DUENO de la sede de la oferta; solo RESERVADA → ENTREGADA (se permite aunque el plazo haya vencido, C10). 200 / 404 `RESERVA_NO_ENCONTRADA` / 403 `PROHIBIDO` (sede ajena) / 409 `RESERVA_NO_ENTREGABLE`. SWR RES-015.
- Dominio puro (el reloj entra como `ahora`):
  - `calcularPlazoRetiro(ahora, cierreSede: Date | null, vencimiento)` = el menor entre `ahora + 12 h`, `cierreSede` (si no es `null`) y `vencimiento`.
  - `calcularCierreSede(sede, horarios, ahora)` → `null` si `sede.abierta24h`; si no, la fecha-hora de cierre del día de `ahora` (en `America/Bogota`). Un día sin fila de horario en una sede no 24 h es error de configuración (500 registrado en logs; las semillas cargan los 7 días).
  - `verificarReserva(oferta, cantidad, ahora)` → `'OK'` o el primer error en el orden CANTIDAD_INVALIDA, OFERTA_NO_ACTIVA, PRODUCTO_VENCIDO (`vencimiento <= ahora`), STOCK_INSUFICIENTE (`cantidad > disponible`).
  - `verificarCancelacion(reserva, ahora)` → `'OK'` o `'RESERVA_NO_CANCELABLE'` si el estado no es RESERVADA o el plazo ya no está vigente (vigente = `ahora < plazoRetiro`).
- Controladores delgados; errores `{codigo, mensaje}` con textos de `common/errores.ts`.

## 4. Frontend (apps/web, plantilla Kiranism; detalle en `componentes_plantilla.md`)
| Ruta | Acceso | Componente | Base de plantilla | SWR |
|---|---|---|---|---|
| `/login` | público | `LoginForm` | `sign-in-view` + `user-auth-form`, `ui/field`, `loading-button` | AUTH-005, 006 |
| `/registro` | público | `RegisterForm` | `sign-up-view`, `text-field`, `form.ts` | AUTH-001 |
| `/ofertas` (`?q=`) | público | `ListaOfertas` + `ReservaForm` | `product-listing`, `card`, `data-table-toolbar`, `skeleton`, `empty`, `nuqs` | BUS-001, BUS-005, RES-001/002/003/005 |
| `/ofertas/nueva` | DUENO, PERSONAL | `OfertaForm` en `RutaProtegida`; selector de sede con `GET /sedes/mias` (preseleccionada si hay una sola) | `product-form`, `select-field`, `page-container` | OFE-001, 003, AUTH-010 |
| `/reservas` | CONSUMIDOR | `MisReservas` | `users-table` (`columns`, `cell-action`), `alert-dialog` | RES-011 |
| `/gestion/reservas` | PERSONAL, DUENO | `ReservasSede` (filtro de sede con `GET /sedes/mias`) | misma tabla + `data-table-faceted-filter` | RES-015 |
- Transversales: `AuthProvider` (token + usuario, `localStorage`, D10), `RutaProtegida roles={[…]}` (sin sesión → `/login` con «Debes iniciar sesión»; rol incorrecto → «No tienes permiso para realizar esta acción», C2), `lib/api-client.ts` con `Authorization: Bearer` y errores `{codigo, mensaje}`, sidebar por rol, «Cerrar sesión» solo borra el token (Decisión #8).
- Éxitos y errores siempre dentro del componente (`role="status"` / `role="alert"`); el toast es opcional y adicional. kbar descartado.
- Validación en cliente de `OfertaForm`/`ReservaForm` con los mismos mensajes que el API (BB-06: «La cantidad debe ser un número entero positivo», «El precio de oferta debe ser menor al precio original»).
- Marca y limpieza: ver `componentes_plantilla.md` (tema único `foodsave.css` desde `brand-tokens.css`; Fredoka/Nunito con `next/font/google`; logos de `docs/marca/logo`).

## 5. Diseño de logs (backend)
- `RequestLoggerInterceptor` global: una línea JSON por petición `{ts, nivel, metodo, ruta (plantilla, p. ej. /reservas/:id/cancelar), estado, duracionMs, usuarioId?, codigoError?}`; nivel por estado (<400 info, 4xx warn, 5xx error).
- `EventLogger` (JSON `tipo:'evento'`): `LOGIN_FALLIDO` (sin indicar qué dato falló), `LOGIN_OK`, `RESERVA_RECHAZADA {motivo}`, `RESERVA_CREADA`, `RESERVA_CANCELADA`, `RESERVA_ENTREGADA`, `OFERTA_PUBLICADA`, `ACCESO_DENEGADO`.
- `redact.ts`: nunca registra `contrasena`, `password`, `passwordHash`, `accessToken` ni la cabecera `Authorization` (prueba UNIT-16).
- Salida a `stdout`, sin librerías extra; sirve de insumo para `13_Shift_Right_Logs`.

## 6. Semillas, variables de entorno y versiones
- **Variables** (`.env.example` sin valores): `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `SEED_PASSWORD`, `SEED_ALLOW_RESET`, `CORS_ORIGIN`, `PORT`, `NEXT_PUBLIC_API_URL`. `.env` fuera de Git.
- **Reinicio protegido:** `npm run seed:test` (y `npm run seed`, que también reinician los datos) se **niegan a ejecutarse salvo que `.env` tenga `SEED_ALLOW_RESET=true`**; no se compara el nombre de la base de datos. Sin el flag: mensaje claro y código de salida distinto de 0, sin tocar la BD.
- **Datos:** 1 comercio APROBADO; **Sede Centro** (`abierta24h = true`, sin filas de horario) y **Sede Norte** (`abierta24h = false`, 7 filas de horario con cierre 20:00); `dueno@` (comercio, ambas sedes), `personal@` (Sede Centro), `consumidor1@`, `consumidor2@`, `admin@` (`@foodsave.test`), con hash bcryptjs y contraseña de `SEED_PASSWORD`. `seed:test` no crea ofertas (E2E/Postman crean las suyas con `Date.now()`); `seed` (demo) crea «Pan integral» y «Tajada de torta» (D7). Sin categorías (D8).
- **Versiones y herramientas (apps/api y raíz):** versiones **estables y compatibles entre sí** de NestJS, Jest y ts-jest (misma línea mayor de Jest y ts-jest) y **TypeScript 5.x estable**; **no** se hereda TypeScript 7.0.2 de la plantilla. Antes de instalar compruebo la compatibilidad con `npm view <paquete> peerDependencies` y te informo las versiones exactas elegidas; quedan fijadas en `package.json`/`package-lock.json`. Un único TypeScript en la raíz para `api` y `web` salvo que Next exija otro (se reporta antes de decidir). Todos los scripts con **npm** (ni `bun`, ni `bun.lock`, ni `bunfig.toml`; los scripts de la plantilla que llaman a `bun run` se reescriben).

## 7. Orden de desarrollo: ramas y PR (a `develop`)
0. `docs/plan-aprobado` — `plan_aprobado.md` + `componentes_plantilla.md`.
0b. Ajuste del contrato y la matriz — **lo ejecutó el equipo, no la IA**, fuera de la sesión de Claude Code y en un PR aparte: aplica la sección §10 a los `.xlsx`, `CLAUDE.md`, `SWR_seleccionados.md` y `Log_Cambios_SRS.md`.
1. `chore/monorepo-base` — workspaces npm, TypeScript 5.x, Nest, Prisma, Jest/Vitest, `.env.example`, logs globales + `redact` + UNIT-16.
2. `feature/auth-api` — Usuario/Comercio/Sede, `hashPassword` + UNIT-08, register/login, guards, errores comunes, seed de usuarios con `SEED_ALLOW_RESET`, UNIT-14 y UNIT-15. **AUTH-001/005/006/010, SEC-002.**
3. `feature/web-base` — plantilla limpia (sin Clerk ni demos), marca, layout/sidebar, `AuthProvider`, `RutaProtegida`, `/login`, `/registro`. **Cierra la autenticación completa (API + UI) antes del flujo principal.**
4. `feature/ofertas-api` — Oferta/HorarioSede, `validarOferta` + UNIT-04/05/06 + WB-06, `POST/GET /ofertas`, `GET /sedes/mias`. **OFE-001/003, BUS-001/005 (API).**
5. `feature/ofertas-web` — `/ofertas` y `/ofertas/nueva`.
6. `feature/reservas-api` — `calcularCierreSede` (UNIT-12/13), `calcularPlazoRetiro` (UNIT-01..03, WB-01, **WB-07**), `verificarReserva` (UNIT-07, WB-02..05), `POST /reservas` transaccional. **RES-001/002/003/005.**
7. `feature/reservas-web` — `ReservaForm` en `/ofertas`.
8. `feature/reservas-cierre-api` — `verificarCancelacion` (UNIT-09..11), cancelar, entregar, listados. **RES-011, RES-015.**
9. `feature/reservas-cierre-web` — `/reservas`, `/gestion/reservas`.
Después (Etapa 8, ramas `test/...`): RTL, Postman, Playwright, caja negra. Commits `tipo(módulo): descripción`; nunca commit en `main`/`develop`; cada PR indica SWR, pruebas y cómo ejecutarlas.

## 8. Prueba unitaria que acompaña a cada SWR
| SWR | Regla / función | Prueba que nace con ella |
|---|---|---|
| SEC-002 | `hashPassword`/`verifyPassword` | UNIT-08 (`auth/password.spec.ts`) |
| OFE-003 | `validarOferta` | UNIT-04, 05, 06, WB-06 (`ofertas/validar-oferta.spec.ts`) |
| RES-005 | `calcularPlazoRetiro` | UNIT-01, 02, 03, WB-01, **WB-07** (`reservas/plazo-retiro.spec.ts`) |
| RES-005 | `calcularCierreSede` (nueva) | **UNIT-12, UNIT-13** (`reservas/cierre-sede.spec.ts`) |
| RES-002 | `verificarReserva` | UNIT-07, WB-02, 03, 04, 05 (`reservas/verificar-reserva.spec.ts`) |
| RES-011 | `verificarCancelacion` (nueva) | **UNIT-09, 10, 11** (`reservas/verificar-cancelacion.spec.ts`) |
| AUTH-006 | respuesta genérica de login | **UNIT-14** (`auth/auth.service.spec.ts`), D9 |
| AUTH-010 | `RolesGuard` | **UNIT-15** (`auth/roles.guard.spec.ts`), D9 |
| (regla CLAUDE.md) | `redact` de logs | **UNIT-16** (`common/logging/redact.spec.ts`), D9 |
| AUTH-001, OFE-001, BUS-001/005, RES-001/003, RES-015 | sin regla pura propia | Se cubren con RTL/Postman/E2E/caja negra de la matriz; no se inventan funciones (RES-003 y RES-011 también por API-06/API-08) |

## 9. Contradicciones y vacíos (resueltos según tus aprobaciones; ninguno en silencio)
C1 mensajes de campos obligatorios → textos de RTL-01. C2 sin sesión/rol incorrecto → se sigue la matriz (el TC-AUTH-005 del SRS se anota en el log). C3 `sedeId` sin fuente → `GET /sedes/mias` (D1). C4 sede 24 h → `abierta24h` + `cierreSede = null` (D2). C5/C6 códigos y `verificarCancelacion` (D3). C7 listado `ACTIVA AND disponible>0 AND vencimiento>ahora` (D4). C8 se permite publicar con vencimiento pasado (limitación, Decisión #6). C9 DTO solo valida tipo numérico; negativos/cero → limitación declarada (Bloque C), hallazgo candidato. C10 reservas con plazo vencido: no cancelables, sí entregables; stock no se libera (sin expiración). C11 409 de correo duplicado revela que el correo existe (riesgo aceptado). C12 verbos mixtos `POST …/cancelar` y `PATCH …/entregar` se respetan tal cual.

## 10. Cambios al contrato y a la matriz de pruebas (lista exacta)

### 10.1 Hoja «Contrato provisional» (`04_Matriz_Pruebas.xlsx`)
**Endpoint nuevo**
| Tipo | Elemento | Acceso | Salida | SWR |
|---|---|---|---|---|
| Endpoint | `GET /sedes/mias` | DUENO, PERSONAL | 200 `[{id, nombre}]` (PERSONAL: su sede; DUENO: las de su comercio) | SWR-OFE-001; SWR-RES-015 (dep. implícita e) |

**Salidas/errores que se añaden a filas existentes**
- `POST /auth/register`: añade `400 CAMPOS_INVALIDOS` (nombre, correo o contraseña vacíos) y `409 CORREO_DUPLICADO`.
- `POST /auth/login`: añade `400 CAMPOS_INVALIDOS` (correo o contraseña vacíos).
- Todos los endpoints protegidos: `401 NO_AUTENTICADO` (sin token o token inválido) y `403 PROHIBIDO` (rol o sede no autorizados).
- `POST /ofertas`: añade `400 CAMPOS_INVALIDOS` (cantidad o precios no numéricos) y `403 PROHIBIDO` si `sedeId` no pertenece al usuario.
- `POST /reservas`: añade `400 CAMPOS_INVALIDOS` (cantidad u ofertaId de tipo inválido) y `404 OFERTA_NO_ENCONTRADA`.
- `GET /ofertas?q=`: la salida pasa a «solo `estado = ACTIVA`, `disponible > 0` y `vencimiento` posterior a la hora actual».
- `GET /reservas?sedeId=&estado=`: añade `403 PROHIBIDO` para sede ajena.
- `POST /reservas/:id/cancelar`: añade `404 RESERVA_NO_ENCONTRADA` (no existe o no es del usuario) y `409 RESERVA_NO_CANCELABLE` (estado distinto de RESERVADA o plazo vencido).
- `PATCH /reservas/:id/entregar`: añade `404 RESERVA_NO_ENCONTRADA`, `403 PROHIBIDO` (otra sede) y `409 RESERVA_NO_ENTREGABLE` (estado distinto de RESERVADA).

**Funciones**
- Modificada: `calcularPlazoRetiro(ahora, cierreSede, vencimiento)` → `cierreSede` puede ser `null` (sede 24 h: no limita); se mantiene «el menor entre ahora + 12 h, el cierre (si existe) y el vencimiento».
- Nueva: `verificarCancelacion(reserva, ahora)` → `'OK'` o `'RESERVA_NO_CANCELABLE'` (vigente = `ahora < plazoRetiro`). SWR-RES-011.
- Nueva: `calcularCierreSede(sede, horarios, ahora)` → `null` si la sede es 24 h; si no, la fecha-hora de cierre del día de `ahora` en `America/Bogota`. SWR-RES-005.

**Entidades**
- Nueva fila **Sede**: `id`, `nombre`, `abierta24h` (boolean); cierre por día en `HorarioSede` solo si `abierta24h = false`.
- `Oferta` y `Reserva`: sin cambios de estados.

### 10.2 Hoja «Datos y mensajes»
**Textos que cambian**
- Fila «El nombre/correo/contraseña es obligatorio» → se reemplaza por tres filas: «El nombre es obligatorio», «El correo es obligatorio», «La contraseña es obligatoria» (uso: RTL-01).
- Fila «Sede Centro»: «Horario de atención 24 h…» → «`abierta24h = true`, sin filas de horario (24 h, para que ninguna prueba dependa del reloj)».
- Fila «Sede Norte»: «Cierre a las 20:00» → «`abierta24h = false`, 7 filas de horario con cierre 20:00».
- Fila «Reinicio» (`npm run seed:test`): añade «requiere `SEED_ALLOW_RESET=true` en `.env`».
- Fila «Contraseña»: sin cambios (la variable sigue siendo `SEED_PASSWORD`); se añade nota de que el registro solo exige no vacía.
- Fila «Debes iniciar sesión»: además de la ruta protegida, es el mensaje del código `NO_AUTENTICADO`.

**Mensajes nuevos (código → texto)**
| Código | HTTP | Mensaje |
|---|---|---|
| `NO_AUTENTICADO` | 401 | Debes iniciar sesión |
| `CORREO_DUPLICADO` | 409 | Ya existe una cuenta con ese correo |
| `CAMPOS_INVALIDOS` | 400 | Los datos enviados no son válidos |
| `OFERTA_NO_ENCONTRADA` | 404 | La oferta no existe |
| `RESERVA_NO_ENCONTRADA` | 404 | La reserva no existe |
| `RESERVA_NO_CANCELABLE` | 409 | La reserva no se puede cancelar |
| `RESERVA_NO_ENTREGABLE` | 409 | La reserva no se puede marcar como entregada |

(`PROHIBIDO`, `CREDENCIALES_INVALIDAS`, `CANTIDAD_INVALIDA`, `PRECIO_INVALIDO`, `STOCK_INSUFICIENTE`, `OFERTA_NO_ACTIVA`, `PRODUCTO_VENCIDO` ya existen y conservan su texto.)
**Datos nuevos:** variable `SEED_ALLOW_RESET=true` (solo `.env` local, no se versiona); nota de que `seed:test` deja el sistema sin ofertas.

### 10.3 Pruebas nuevas o modificadas (Matriz de pruebas, Unitarias, Caja blanca, Caja blanca - caminos, Resumen)
**Nuevas unitarias (Jest):** UNIT-09 `verificarCancelacion` con plazo vigente → OK; UNIT-10 con plazo vencido (y frontera `ahora = plazoRetiro` → no cancelable) → `RESERVA_NO_CANCELABLE`; UNIT-11 con estado ENTREGADA/CANCELADA → `RESERVA_NO_CANCELABLE` (SWR-RES-011, `verificar-cancelacion.spec.ts`); UNIT-12 `calcularCierreSede` sede 24 h → `null`; UNIT-13 `calcularCierreSede` sede con horario → cierre del día en Bogotá (SWR-RES-005, `cierre-sede.spec.ts`); UNIT-14 login con correo inexistente y con clave errada devuelven la misma respuesta (SWR-AUTH-006, `auth.service.spec.ts`); UNIT-15 `RolesGuard` permite el rol correcto y deniega el resto (SWR-AUTH-010, `roles.guard.spec.ts`); UNIT-16 `redact` elimina contraseñas, hash, token y `Authorization` (sin SWR propio: regla de CLAUDE.md, `redact.spec.ts`). Unitarias: **8 → 16** (el mínimo exigido, 8, sigue cumplido).
**Nueva caja blanca: WB-07** (SWR-RES-005, `plazo-retiro.spec.ts`): `calcularPlazoRetiro(ahora 07:00, cierreSede null, vencimiento 23:00)` → 19:00 (camino N: sede 24 h). Pruebas WB adicionales: **6 → 7**.
**Bloque A pasa de 4 a 5 caminos** (hojas «Caja blanca» y «Caja blanca - caminos»): se añade la fila «A | N: sede 24 h (cierre `null`) | 07:00, `null`, 23:00 | 19:00 | WB-07»; se actualiza el pseudocódigo (`if (cierreSede !== null && cierreSede < plazo)`), «¿Qué decisión contiene?» (tres decisiones: ¿hay cierre?, ¿cierre < límite 12 h?, ¿vencimiento < plazo?), «ramas» (cinco), «datos» (añade WB-07), «frontera/mapeo» (N → WB-07) y «camino sin cubrir»: la combinación `cierre = null` con vencimiento limitante (N+T) no tiene prueba propia (la rama del vencimiento ya la cubren TT y FT).
**Pruebas existentes cuyo texto cambia:** BB-05 y E2E-05/E2E-01 añaden el paso «seleccionar la sede (Sede Centro)» en `/ofertas/nueva`; API-04 añade como precondición «obtener `sedeId` con `GET /sedes/mias` y guardarlo en el environment»; BB-07 precondición «se ejecutó `npm run seed` (demo) para que existan Pan integral y Tajada de torta» (con `seed:test` no hay ofertas); BB-08/BB-09 y E2E-01/02 sin cambios en resultados.
**Sin cambios:** RTL-01..12 (mensajes de RTL-01 coinciden con la corrección C1), API-01..03 y 05..08, E2E-03/04, BB-01..04, 06, 10.
**Hojas con efecto en fórmulas:** «Resumen» (planificado: Unitarias 16, caja blanca adicionales 7) y «Cobertura por SWR» (recuentos de RES-005, RES-011, AUTH-006, AUTH-010) se recalculan; no cambia la cobertura de ningún SWR (los 15 siguen con prueba).

### 10.4 Otros documentos a actualizar
- `01_Alcance_y_Trazabilidad.xlsx` hoja «Decisiones»: #2 (sede con `abierta24h`), #5 (añadir dependencia implícita e: `GET /sedes/mias`), #3 (`calcularPlazoRetiro` con cierre nulo para sede 24 h).
- `CLAUDE.md`: lista de variables de entorno (+ `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `PORT`, `SEED_ALLOW_RESET`) y nota de que `seed`/`seed:test` exigen `SEED_ALLOW_RESET=true`.
- `Log_Cambios_SRS.md`: anotar que TC-AUTH-005 («lo redirige al inicio de sesión») se aplica solo al caso sin sesión; el rol incorrecto muestra «No tienes permiso…» (C2).

## 11. Decisiones y riesgos
**Ya aprobadas:** C1, C2, C5/D3, C7/D4, C8, C10, C11, D1, D2 (con campo `abierta24h`), D6, D7, D8, D9, D10, D11, variables de D5, y los 7 ajustes de tu última revisión.

**Pendientes de tu aprobación (mi recomendación entre paréntesis):**
1. Frontera de cancelación: cancelable solo si `ahora < plazoRetiro` (✔; con `ahora = plazoRetiro` ya no, igual que `vencimiento = ahora` es vencido).
2. Propiedad: reserva ajena para el consumidor → `404 RESERVA_NO_ENCONTRADA` (no revela existencia); sede ajena para personal/dueño → `403 PROHIBIDO` (✔).
3. Sede no 24 h sin fila de horario para el día: error de configuración 500 registrado en logs, no un código de negocio nuevo; las semillas cargan los 7 días (✔).
4. `SEED_ALLOW_RESET=true` exigido a **ambos** `seed` y `seed:test` porque los dos reinician datos (✔).
5. Un único TypeScript 5.x en la raíz para `api` y `web`; si la versión de Next de la plantilla lo impide, te aviso antes de cambiar nada (✔).
6. Aplicar §10 a los `.xlsx`, `CLAUDE.md`, `SWR_seleccionados.md` y `Log_Cambios_SRS.md`: lo ejecutó el equipo fuera de la sesión de Claude Code, en un PR aparte (paso 0b).
7. UNIT-16 (`redact`) no tiene SWR en la matriz; se registra como «regla de CLAUDE.md» (✔).

**Riesgos:** (1) sobreventa: se mitiga con el `UPDATE … WHERE disponible >= n` en la transacción; no hay prueba de concurrencia en la matriz. (2) Dependencia del reloj en E2E/BB-08: la Sede Centro 24 h y vencimientos lejanos la reducen. (3) Plantilla Next 16/React 19/Tailwind 4 con base-ui muy reciente: la limpieza (Clerk, ~14 páginas demo, 10 temas) puede subestimarse; criterio de salida: `build` y `typecheck` limpios. (4) Todo cambio de contrato obliga a actualizar la matriz; se declara en cada PR. (5) Supabase: `DATABASE_URL` (pooler) vs. `DIRECT_URL` (migraciones). (6) Seguridad: token en `localStorage` (XSS), 409 de registro que enumera correos, sin límite de intentos; para la Etapa 9. (7) Reservas sin expiración dejan stock «congelado»; limitación conocida. (8) Precio/cantidad negativos o cero se aceptan (hallazgo candidato, no se corrige). (9) Editar `.xlsx` con fórmulas puede romper formato; se hará con cuidado y revisión.

## Verificación (tras implementar, por etapa)
`npm test` (UNIT-01..16, WB-01..07), `npm run build` y `typecheck` en `api` y `web`, `npm run seed:test` con y sin `SEED_ALLOW_RESET`, recorrido manual (dueño publica → consumidor busca y reserva → personal entrega; cancelación), `grep -ri clerk apps/web` vacío, y revisión de logs JSON sin secretos.

---

**Ajuste posterior a la aprobación:** el paso 0b lo ejecutó el equipo, no la IA. La sección 10 se aplicó a los .xlsx, CLAUDE.md, SWR_seleccionados.md y Log_Cambios_SRS.md fuera de la sesión de Claude Code.

---

## Desviaciones respecto al plan

Detectadas y aceptadas durante `chore/monorepo-base`:

1. **Middleware en vez de interceptor para los logs de petición.** `request-logger.interceptor.ts` pasa a ser `request-logger.middleware.ts`. Los interceptores no se ejecutan cuando un guard rechaza la petición (401/403) ni en rutas inexistentes (404), y esas respuestas deben quedar registradas. El middleware escribe al terminar la respuesta, con el estado final. `CLAUDE.md` se actualiza a «middleware global».
2. **Vitest y `e2e` se crean después.** Vitest + React Testing Library se instalan en `feature/web-base`, cuando exista `apps/web`; el workspace `e2e` se añade cuando se cree Playwright (Etapa 8). Por ahora `workspaces` es solo `apps/*`.
3. **Códigos `RUTA_NO_ENCONTRADA` (404) y `ERROR_INTERNO` (500).** No están en el contrato; son solo de infraestructura (ruta inexistente y fallos inesperados) para que toda respuesta de error tenga forma `{ codigo, mensaje }`. No se añaden a las hojas «Contrato provisional» ni «Datos y mensajes».
4. **Evento `SERVIDOR_INICIADO` y prueba extra del middleware.** Se registra un evento al arrancar la API y se añade `request-logger.middleware.spec.ts` (3 casos), que no figura en la matriz de pruebas.
5. **Sin endpoint de prueba.** No se creó ningún endpoint para comprobar los logs; se verificaron con una petición a una ruta inexistente (404).
