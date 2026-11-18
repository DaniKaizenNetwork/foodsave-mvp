# Explicación a nivel de código de E2E-01 y E2E-02

Estas dos pruebas de Playwright recorren el sistema real: navegador (Chrome) → Next.js (`apps/web`) → API NestJS (`apps/api`) → PostgreSQL. A diferencia de las pruebas RTL, **nada se simula**. Resultado de la última ejecución registrada en `resultado_playwright_consola.txt`: E2E-02 ✓ (10,0 s) y E2E-01 ✓ (14,2 s).

## Configuración que afecta a las dos pruebas

(`e2e/playwright.config.ts`, líneas 22–35)

| Opción | Valor | Efecto |
|---|---|---|
| `workers` / `fullyParallel` | 1 / `false` | Los casos corren uno tras otro, para no competir por los mismos datos. |
| `retries` | 0 | Un fallo no se reintenta: se reporta tal cual. |
| `timeout` | 60 s por prueba | Tiempo máximo de todo el caso. |
| `expect.timeout` | 10 s | Cada `expect(...)` **reintenta** hasta 10 s antes de fallar. |
| `baseURL` | la URL de la web | Permite escribir `page.goto('/login')`. |
| `channel` | `chrome` | Usa el Chrome instalado. |
| `locale` / `timezoneId` | `es-CO` / `America/Bogota` | Textos y fechas como los verá un usuario en Neiva. |
| `trace` | `on` | Guarda la traza de cada caso (se usa en el reporte HTML). |

Prerrequisitos de datos: las cuentas `@foodsave.test` sembradas con `npm run seed:test` (comercio con Sede Centro y Sede Norte, dueño, personal de Sede Centro, consumidores). La contraseña viene de la variable de entorno `SEED_PASSWORD` y **no** está en el código (`utilidades.ts`, líneas 4–8).

## Conceptos de Playwright usados

- **Locator**: una descripción de «cómo encontrar un elemento» que se evalúa en el momento de usarlo. Preferimos los que usan lo que ve el usuario: `getByRole`, `getByLabel`, `getByText`. No hay selectores CSS ni `data-testid`.
- **Auto-espera**: acciones como `click()` y `fill()` esperan a que el elemento exista, esté visible y habilitado. No hay `sleep` ni esperas fijas en estas pruebas.
- **Aserciones web-first**: `await expect(locator).toBeVisible()` / `toContainText(...)` reintentan hasta cumplirse o agotar los 10 s. Por eso el código no necesita «esperar a que cargue».
- **Contexto de navegador** (`browser.newContext`): una sesión aislada (sin cookies ni `localStorage` compartidos). E2E-01 abre tres, uno por persona.

## Funciones auxiliares (`e2e/tests/utilidades.ts`)

`e2e/tests/utilidades.ts` (líneas 18–48)

```ts
18 | /** Nombre de producto único por ejecución: los casos no dependen de otros datos. */
19 | export function nombreUnico(prefijo = 'E2E'): string {
20 |   return `${prefijo} ${Date.now()}`;
21 | }
22 |
23 | /** Fecha-hora local de Bogotá `dias` días adelante, en el formato de `<input type="datetime-local">`. */
24 | export function vencimientoLocal(dias: number): string {
25 |   const fecha = new Date(Date.now() + dias * 24 * 3600 * 1000);
26 |   return fecha.toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).replace(' ', 'T').slice(0, 16);
27 | }
28 |
29 | /** Contexto de navegador nuevo (= sesión nueva) con la misma zona horaria que la configuración. */
30 | export function nuevoContexto(browser: Browser): Promise<BrowserContext> {
31 |   return browser.newContext({ locale: 'es-CO', timezoneId: 'America/Bogota' });
32 | }
33 |
34 | /** Inicia sesión por la interfaz y espera a llegar a /ofertas. */
35 | export async function iniciarSesion(page: Page, correo: string, contrasena = claveSemilla()): Promise<void> {
36 |   await page.goto('/login');
37 |   await page.getByLabel('Correo electrónico').fill(correo);
38 |   await page.getByLabel('Contraseña').fill(contrasena);
39 |   await page.getByRole('button', { name: 'Ingresar' }).click();
40 |   await expect(page).toHaveURL('/ofertas');
41 | }
42 |
43 | /** Busca una oferta por nombre en /ofertas y devuelve su tarjeta. */
44 | export async function buscarOferta(page: Page, nombre: string) {
45 |   await page.getByRole('searchbox', { name: 'Buscar ofertas' }).fill(nombre);
46 |   await page.getByRole('button', { name: 'Buscar' }).click();
47 |   return page.getByRole('listitem').filter({ hasText: nombre });
48 | }
```

| Líneas | Qué hace |
|---|---|
| 19–21 | `nombreUnico(prefijo)`: `«E2E 1763471234567»` (prefijo + milisegundos actuales). Hace que cada ejecución cree un producto distinto y que los casos no se mezclen con datos de otras ejecuciones. |
| 24–27 | `vencimientoLocal(dias)`: fecha-hora de Bogotá en el formato de `<input type="datetime-local">` (`2026-11-20T09:15`). |
| 30–32 | `nuevoContexto`: contexto nuevo con la misma zona horaria y el mismo idioma que la configuración. |
| 35–41 | `iniciarSesion`: abre `/login`, escribe correo y contraseña por **etiqueta**, pulsa «Ingresar» y espera `toHaveURL('/ofertas')`: confirma que el login funcionó (si falla, la URL no cambia y el `expect` agota 10 s). |
| 44–48 | `buscarOferta`: escribe el nombre en el campo de búsqueda («Buscar ofertas»), pulsa «Buscar» y devuelve el *locator* de la tarjeta (`listitem`) que contiene ese nombre. Como el nombre es único, solo coincide una tarjeta. |

La preparación por API (`publicarOfertaPorApi`, líneas 51–79) solo la usa E2E-02; se explica allí.

---

## E2E-01 · Flujo principal (SWR-AUTH-005, OFE-001, BUS-001, RES-001/003/005, RES-015)

**Historia:** el dueño publica una oferta de 5 unidades, el consumidor la busca y reserva 2, y el personal de la sede la marca «Entregada».

### Código real

`e2e/tests/flujo-principal.spec.ts` (líneas 4–57)

```ts
 4 | /**
 5 |  * E2E-01 · Flujo principal (SWR-AUTH-005, OFE-001, BUS-001, RES-001/003/005, RES-015).
 6 |  * Tres personas distintas, cada una en su propio contexto de navegador (= su propia sesión):
 7 |  * el dueño publica, el consumidor reserva y el personal marca «Entregada».
 8 |  */
 9 | test('E2E-01: el dueño publica, el consumidor reserva y el personal entrega', async ({ browser }) => {
10 |   // Nombre único: así el caso no se mezcla con datos de otras ejecuciones.
11 |   const producto = nombreUnico('E2E');
12 |
13 |   // ── Paso 1 · El DUEÑO publica una oferta de 5 unidades en «Sede Centro» ─────────────────
14 |   const contextoDueno = await nuevoContexto(browser); // sesión independiente 1
15 |   const dueno = await contextoDueno.newPage();
16 |   await iniciarSesion(dueno, CUENTAS.dueno); // login por la interfaz; espera llegar a /ofertas
17 |   await dueno.goto('/ofertas/nueva'); // pantalla de publicación (solo DUENO y PERSONAL)
18 |   await dueno.getByLabel('Producto').fill(producto);
19 |   await dueno.getByLabel('Precio original').fill('8000');
20 |   await dueno.getByLabel('Precio de oferta').fill('4000'); // menor al original: cumple la regla
21 |   await dueno.getByLabel('Cantidad').fill('5');
22 |   await dueno.getByLabel('Vencimiento').fill(vencimientoLocal(2)); // dentro de 2 días, hora de Bogotá
23 |   await dueno.getByRole('combobox').click(); // el dueño tiene 2 sedes: debe elegir una
24 |   await dueno.getByRole('option', { name: 'Sede Centro' }).click(); // sede 24 h: el plazo no depende de la hora
25 |   await dueno.getByRole('button', { name: 'Publicar' }).click();
26 |   await expect(dueno.getByText('Oferta publicada')).toBeVisible(); // confirmación dentro de la página
27 |
28 |   // ── Paso 2 · El CONSUMIDOR busca la oferta y reserva 2 unidades ─────────────────────────
29 |   const contextoConsumidor = await nuevoContexto(browser); // sesión independiente 2
30 |   const consumidor = await contextoConsumidor.newPage();
31 |   await iniciarSesion(consumidor, CUENTAS.consumidor1);
32 |   const tarjeta = await buscarOferta(consumidor, producto); // escribe el nombre y pulsa «Buscar»
33 |   await expect(tarjeta).toContainText('5 disponibles'); // aún no se ha reservado nada
34 |   await tarjeta.getByRole('button', { name: 'Reservar' }).click(); // abre el diálogo de reserva
35 |   const dialogo = consumidor.getByRole('dialog'); // se acota al diálogo: la tarjeta también tiene «Reservar»
36 |   await dialogo.getByLabel('Cantidad').fill('2');
37 |   await dialogo.getByRole('button', { name: 'Reservar' }).click();
38 |
39 |   // ── Paso 3 · El consumidor ve la confirmación con el plazo de retiro ────────────────────
40 |   await expect(dialogo.getByText('Reserva confirmada')).toBeVisible();
41 |   await expect(dialogo.getByText(/Plazo de retiro:/)).toBeVisible();
42 |   await dialogo.getByRole('button', { name: 'Cerrar' }).first().click(); // el listado se refresca al cerrar
43 |   await expect(tarjeta).toContainText('3 disponibles'); // 5 − 2: el inventario se descontó
44 |
45 |   // ── Paso 4 · El PERSONAL de la sede marca la reserva como entregada ─────────────────────
46 |   const contextoPersonal = await nuevoContexto(browser); // sesión independiente 3
47 |   const personal = await contextoPersonal.newPage();
48 |   await iniciarSesion(personal, CUENTAS.personal);
49 |   await personal.goto('/gestion/reservas');
50 |   const fila = personal.getByRole('row').filter({ hasText: producto }); // la fila de esta reserva
51 |   await expect(fila).toContainText('Consumidor Uno'); // el personal ve a quién le entrega
52 |   await fila.getByRole('button', { name: 'Marcar entregada' }).click();
53 |   await expect(personal.getByText('Reserva marcada como entregada')).toBeVisible();
54 |   await expect(fila.getByText('Entregada')).toBeVisible(); // el estado de la fila cambió
55 |
56 |   await Promise.all([contextoDueno.close(), contextoConsumidor.close(), contextoPersonal.close()]);
57 | });
```

### Qué hace cada paso

| Líneas | Acción | Selector | Espera / aserción |
|---|---|---|---|
| 11 | Crea el nombre único del producto. | — | — |
| 14–15 | Abre una sesión nueva para el **dueño**. | — | — |
| 16 | Inicia sesión como `dueno@foodsave.test`. | etiquetas «Correo electrónico» y «Contraseña», botón «Ingresar» | `toHaveURL('/ofertas')` dentro de `iniciarSesion`. |
| 17 | Va a `/ofertas/nueva` (pantalla solo para DUENO y PERSONAL). | URL | — |
| 18–22 | Llena producto, precio original `8000`, precio de oferta `4000`, cantidad `5` y vencimiento dentro de 2 días. | `getByLabel('Producto' / 'Precio original' / 'Precio de oferta' / 'Cantidad' / 'Vencimiento')` | `fill` espera a que cada campo sea editable. |
| 23–24 | Elige la sede. El dueño tiene **dos** sedes, así que el campo no viene preseleccionado. | `getByRole('combobox')` y `getByRole('option', { name: 'Sede Centro' })` | `click` espera a que la opción aparezca al abrir la lista. Se elige Sede Centro porque es 24 h: el plazo no depende de la hora a la que corra la prueba. |
| 25 | Pulsa «Publicar». | `getByRole('button', { name: 'Publicar' })` | — |
| 26 | Comprueba la confirmación **dentro de la página**. | `getByText('Oferta publicada')` | `toBeVisible()` (hasta 10 s). |
| 29–31 | Abre una sesión nueva para el **consumidor** e inicia sesión como `consumidor1@foodsave.test`. | ídem login | `toHaveURL('/ofertas')`. |
| 32 | Busca la oferta por su nombre único. | `searchbox «Buscar ofertas»`, botón «Buscar», `listitem` con el nombre | — |
| 33 | Comprueba el stock inicial. | texto de la tarjeta | `toContainText('5 disponibles')`: aún nada reservado. |
| 34 | Pulsa «Reservar» **en la tarjeta**: abre el diálogo. | `tarjeta.getByRole('button', { name: 'Reservar' })` | — |
| 35 | Acota las búsquedas al diálogo. | `getByRole('dialog')` | Necesario porque la tarjeta también tiene un botón «Reservar»; sin acotar habría dos coincidencias. |
| 36–37 | Escribe cantidad `2` y pulsa «Reservar» dentro del diálogo. | `dialogo.getByLabel('Cantidad')`, `dialogo.getByRole('button', { name: 'Reservar' })` | — |
| 40 | Comprueba la confirmación. | `dialogo.getByText('Reserva confirmada')` | `toBeVisible()`. |
| 41 | Comprueba que muestra el plazo. | `dialogo.getByText(/Plazo de retiro:/)` (expresión regular) | `toBeVisible()`. Se usa regex porque el resto del texto (la fecha) cambia en cada ejecución. |
| 42 | Cierra el diálogo. | `dialogo.getByRole('button', { name: 'Cerrar' }).first()` | `.first()` porque el diálogo tiene **dos** controles llamados «Cerrar» (la «X» de la esquina, con texto solo para lector de pantalla, y el botón del pie: `ui/dialog.tsx`, líneas 65 y 98). El listado se refresca al cerrar (`BotonReservar.tsx`, línea 49). |
| 43 | Comprueba que el inventario se descontó. | la misma `tarjeta` (locator vivo) | `toContainText('3 disponibles')`: 5 − 2. Es una aserción **contra el estado real de la base**, reflejado por la API. |
| 46–48 | Abre una sesión nueva para el **personal** e inicia sesión como `personal@foodsave.test`. | ídem login | — |
| 49 | Va a `/gestion/reservas`. | URL | — |
| 50–51 | Localiza la fila de **esta** reserva y comprueba que muestra al consumidor. | `getByRole('row').filter({ hasText: producto })` | `toContainText('Consumidor Uno')`. Prueba también que el personal ve las reservas de su sede. |
| 52 | Pulsa «Marcar entregada» en esa fila. | `fila.getByRole('button', { name: 'Marcar entregada' })` | — |
| 53 | Comprueba el mensaje de éxito en la página. | `getByText('Reserva marcada como entregada')` | `toBeVisible()`. |
| 54 | Comprueba que la fila cambió de estado. | `fila.getByText('Entregada')` | `toBeVisible()`. |
| 56 | Cierra los tres contextos. | — | `Promise.all` los cierra en paralelo. |

### Observaciones de diseño

- **Tres contextos = tres personas.** Cada uno tiene su propio `localStorage`, donde la web guarda la sesión; con un solo contexto el segundo login reemplazaría al primero.
- **El `locator` `tarjeta` y `fila` se definen una vez y se reutilizan**: Playwright los reevalúa en cada uso, por eso `tarjeta` pasa de «5 disponibles» a «3 disponibles» sin volver a buscarla.
- **Sin esperas fijas**: toda sincronización es por auto-espera y aserciones con reintento.

### Datos que crea y deja en la base

Tras una ejecución exitosa (y **no se borran**; permanecen hasta el siguiente `seed`/`seed:test`):

| Tabla | Qué queda |
|---|---|
| `Oferta` | 1 fila nueva: producto `E2E <milisegundos>`, Sede Centro, precio original 8000, precio de oferta 4000, `cantidad` 5, **`disponible` 3**, vence en ~2 días, estado `ACTIVA`, creada por el dueño. |
| `Reserva` | 1 fila nueva: del consumidor 1 sobre esa oferta, `cantidad` 2, **estado `ENTREGADA`**, `plazoRetiro` = momento de la reserva + 12 h (sede 24 h: no hay cierre y el vencimiento está más lejos). |
| `Usuario`, `Comercio`, `Sede` | Sin cambios (se usan cuentas sembradas). |

Además, la API escribe líneas de log (`OFERTA_PUBLICADA`, `RESERVA_CREADA`, `RESERVA_ENTREGADA`) y Playwright guarda trazas en el reporte. El caso **no** deja datos en el navegador una vez cerrados los contextos.

---

## E2E-02 · Flujo alterno: reservar y cancelar (SWR-RES-001 y SWR-RES-011)

**Historia:** un consumidor reserva 2 de 5 unidades, cancela la reserva y el inventario vuelve a 5. La oferta se prepara por API (no es lo que se prueba) y todo lo demás va por la interfaz.

### Código real

`e2e/tests/flujo-cancelacion.spec.ts` (líneas 4–41)

```ts
 4 | /**
 5 |  * E2E-02 · Flujo alterno: el consumidor reserva y cancela (SWR-RES-001, SWR-RES-011).
 6 |  * La oferta se prepara por API (no es lo que se prueba) y todo lo demás va por la interfaz.
 7 |  */
 8 | test.describe('E2E-02: reservar y cancelar', () => {
 9 |   const producto = nombreUnico('E2E cancelar');
10 |
11 |   // Preparación: el dueño publica por API una oferta de 5 unidades y comprobamos que quedó con 5.
12 |   test.beforeAll(async ({ request }) => {
13 |     const oferta = await publicarOfertaPorApi(request, { producto, cantidad: 5 });
14 |     expect(oferta.disponible).toBe(5);
15 |   });
16 |
17 |   test('el consumidor reserva 2, cancela y el inventario vuelve a 5', async ({ page }) => {
18 |     // ── Pasos 1-2 · Login del consumidor y reserva de 2 unidades ──────────────────────────
19 |     await iniciarSesion(page, CUENTAS.consumidor1);
20 |     const tarjeta = await buscarOferta(page, producto);
21 |     await tarjeta.getByRole('button', { name: 'Reservar' }).click();
22 |     const dialogo = page.getByRole('dialog');
23 |     await dialogo.getByLabel('Cantidad').fill('2');
24 |     await dialogo.getByRole('button', { name: 'Reservar' }).click();
25 |     await expect(dialogo.getByText('Reserva confirmada')).toBeVisible();
26 |     await dialogo.getByRole('button', { name: 'Cerrar' }).first().click();
27 |
28 |     // ── Paso 3 · «Mis reservas»: cancelar la reserva ─────────────────────────────────────
29 |     await page.goto('/reservas');
30 |     const fila = page.getByRole('row').filter({ hasText: producto }); // la fila de esta reserva
31 |     await fila.getByRole('button', { name: 'Cancelar' }).click();
32 |     await expect(page.getByText('Reserva cancelada')).toBeVisible(); // mensaje dentro de la página
33 |     await expect(fila.getByText('Cancelada')).toBeVisible(); // el estado de la fila cambió
34 |     await expect(fila.getByRole('button', { name: 'Cancelar' })).toHaveCount(0); // ya no se puede volver a cancelar
35 |
36 |     // ── Paso 4 · De vuelta en /ofertas el inventario se restituyó ────────────────────────
37 |     await page.goto('/ofertas');
38 |     const tarjetaDeNuevo = await buscarOferta(page, producto);
39 |     await expect(tarjetaDeNuevo).toContainText('5 disponibles'); // 3 + 2 devueltas
40 |   });
41 | });
```

### Preparación por API (`beforeAll`)

`e2e/tests/utilidades.ts` (líneas 50–79)

```ts
50 | /** Preparación por API (sin pasar por la interfaz): publica una oferta como dueño en «Sede Centro». */
51 | export async function publicarOfertaPorApi(
52 |   request: APIRequestContext,
53 |   datos: { producto: string; cantidad: number }
54 | ): Promise<{ id: string; disponible: number }> {
55 |   const login = await request.post(`${URL_API}/auth/login`, {
56 |     data: { correo: CUENTAS.dueno, contrasena: claveSemilla() }
57 |   });
58 |   expect(login.status()).toBe(200);
59 |   const { accessToken } = await login.json();
60 |   const cabeceras = { Authorization: `Bearer ${accessToken}` };
61 |
62 |   const sedes = await (await request.get(`${URL_API}/sedes/mias`, { headers: cabeceras })).json();
63 |   const centro = sedes.find((s: { nombre: string }) => s.nombre === 'Sede Centro');
64 |   expect(centro, 'el dueño debe tener «Sede Centro»').toBeTruthy();
65 |
66 |   const respuesta = await request.post(`${URL_API}/ofertas`, {
67 |     headers: cabeceras,
68 |     data: {
69 |       sedeId: centro.id,
70 |       producto: datos.producto,
71 |       precioOriginal: 8000,
72 |       precioOferta: 4000,
73 |       cantidad: datos.cantidad,
74 |       vencimiento: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString()
75 |     }
76 |   });
77 |   expect(respuesta.status()).toBe(201);
78 |   return respuesta.json();
79 | }
```

| Líneas | Qué hace |
|---|---|
| 55–59 (utilidades) | `POST /auth/login` como dueño, directamente contra la API (`request` de Playwright, sin navegador); comprueba `200` y extrae el `accessToken`. |
| 60 | Arma la cabecera `Authorization: Bearer …`. El token solo vive en memoria durante la prueba y no se imprime. |
| 62–64 | `GET /sedes/mias` y busca «Sede Centro»; el `expect` con mensaje explica el fallo si el dueño no la tiene. |
| 66–76 | `POST /ofertas` con precio 8000 → 4000, la cantidad pedida y vencimiento en 2 días. |
| 77–78 | Comprueba `201` y devuelve `{ id, disponible }`. |

Por qué por API: publicar ya está probado en E2E-01; aquí solo se necesita una oferta conocida. Es más rápido y evita que un fallo de la pantalla de publicación derribe este caso.

### Qué hace cada paso

| Líneas | Acción | Selector | Espera / aserción |
|---|---|---|---|
| 9 | Nombre único (`E2E cancelar <ms>`), evaluado una vez al cargar el archivo. | — | — |
| 12–15 | `beforeAll`: publica la oferta de 5 unidades por API. | `request` (API) | `expect(oferta.disponible).toBe(5)`: precondición, el caso arranca con inventario 5. |
| 19 | Inicia sesión como consumidor. | etiquetas y botón «Ingresar» | `toHaveURL('/ofertas')`. |
| 20–21 | Busca la oferta y pulsa «Reservar» en la tarjeta. | `buscarOferta`, `tarjeta.getByRole('button', …)` | — |
| 22–24 | Escribe `2` y reserva dentro del diálogo. | `getByRole('dialog')` | — |
| 25 | Comprueba la confirmación. | `dialogo.getByText('Reserva confirmada')` | `toBeVisible()`. |
| 26 | Cierra el diálogo. | `getByRole('button', { name: 'Cerrar' }).first()` | `.first()` por los dos controles «Cerrar». |
| 29 | Va a «Mis reservas» (`/reservas`). | URL | — |
| 30–31 | Localiza **la fila de esta reserva** y pulsa «Cancelar». | `getByRole('row').filter({ hasText: producto })`, botón «Cancelar» | — |
| 32 | Mensaje de éxito dentro de la página. | `getByText('Reserva cancelada')` | `toBeVisible()`. |
| 33 | La fila pasó a «Cancelada». | `fila.getByText('Cancelada')` | `toBeVisible()`. |
| 34 | Ya no se puede cancelar otra vez. | `fila.getByRole('button', { name: 'Cancelar' })` | `toHaveCount(0)`: el botón no existe (la interfaz solo lo ofrece en reservas «Reservada» con plazo vigente: `MisReservas.tsx`, línea 212). |
| 37–39 | Vuelve a `/ofertas`, busca de nuevo y comprueba el inventario. | `buscarOferta` | `toContainText('5 disponibles')`: 3 + 2 devueltas. Prueba que la cancelación **restituyó el stock** en la base. |

Nota: el `expect` del paso 34 usa `toHaveCount(0)` en vez de `not.toBeVisible()` porque el elemento debe estar **ausente**, no oculto.

### Datos que crea y deja en la base

No se borran; permanecen hasta el siguiente `seed`/`seed:test`:

| Tabla | Qué queda |
|---|---|
| `Oferta` | 1 fila nueva: producto `E2E cancelar <milisegundos>`, Sede Centro, 8000 → 4000, `cantidad` 5, **`disponible` 5** (se descontó 2 y se devolvió 2), vence en ~2 días, estado `ACTIVA`, creada por el dueño (vía API). |
| `Reserva` | 1 fila nueva: del consumidor 1, `cantidad` 2, **estado `CANCELADA`**. |
| `Usuario`, `Comercio`, `Sede` | Sin cambios. |

Logs de la API: `OFERTA_PUBLICADA`, `RESERVA_CREADA`, `RESERVA_CANCELADA`. Como la oferta sigue `ACTIVA` con 5 unidades, **aparece en el listado público** y puede verla cualquiera hasta que vuelva a correrse el seed.

---

## Qué pasa si se repiten las pruebas

- Los nombres únicos (`Date.now()`) evitan colisiones: cada ejecución añade su propia oferta y reserva.
- Las ofertas sobrantes se acumulan en el listado (de ahí el nombre «E2E …», fácil de reconocer). `npm run seed:test` deja el sistema sin ofertas; solo se ejecuta con `SEED_ALLOW_RESET=true` y **no** lo ejecutó quien escribió este documento.
- Las pruebas no limpian lo que crean: es una decisión del diseño actual (no hay endpoint para borrar ofertas en el alcance del MVP).
