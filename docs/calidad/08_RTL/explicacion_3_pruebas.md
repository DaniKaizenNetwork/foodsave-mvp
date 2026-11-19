# Explicación de tres pruebas RTL: RTL-04, RTL-10 y RTL-12

Las tres pruebas usan **Vitest + React Testing Library + user-event** y se ejecutan en `jsdom` (un navegador simulado, sin red ni base de datos). Los 12 casos RTL-01..12 y su resultado están en `README.md` y `resultado_rtl.txt` de esta carpeta; aquí se explican tres a fondo.

Conceptos que se repiten en las tres:

- **Patrón AAA**: *Arrange* (preparar el escenario), *Act* (hacer lo que haría la persona) y *Assert* (comprobar lo que la persona vería).
- **`renderConProveedores`** (`apps/web/src/test/render.tsx`, líneas 20–32): dibuja el componente dentro de `QueryClientProvider` (TanStack Query, con `retry: false` para que un error aparezca de inmediato) y de `AuthProvider` (la sesión). **No** simula la navegación ni la API: cada prueba declara lo suyo con `vi.mock`.
- **`userEvent.setup()`**: crea un «usuario virtual» que teclea y hace clic de forma parecida a una persona (eventos de teclado, foco, etc.), más fiel que `fireEvent`.
- **Consultas por rol y etiqueta** (`getByLabelText`, `getByRole`): se busca lo que ve el usuario, no clases CSS ni ids. Así la prueba sigue valiendo si cambia el diseño interno.
- **`vi.mock(...)`**: Vitest sustituye un módulo por una versión falsa antes de que el componente lo importe. Se simula todo lo que cruza la frontera del navegador (API, enrutador) para que la prueba sea rápida, determinista y no dependa de un servidor.
- **`findBy…` vs `getBy…`**: `getBy` falla si el elemento no está ya; `findBy` espera (hasta 1 s por defecto) a que aparezca. Se usa `findBy` cuando el resultado llega tras una operación asíncrona.

---

## RTL-04 · `LoginForm` con respuesta 401 (SWR-AUTH-006)

**Comportamiento visible que valida:** quien escribe una clave equivocada ve el mensaje «Credenciales inválidas» dentro del formulario, no es llevado a otra página y no queda ninguna sesión guardada. Es el mensaje genérico exigido por AUTH-006: no dice si falló el correo o la clave.

### Código de la prueba

`apps/web/src/components/LoginForm.test.tsx` (líneas 1–22)

```ts
 1 | import { login } from '@/lib/api/auth';
 2 | import { ErrorApi } from '@/lib/api-client';
 3 | import { CLAVE_SESION } from '@/lib/auth/sesion-storage';
 4 | import { renderConProveedores } from '@/test/render';
 5 | import { screen, waitFor } from '@testing-library/react';
 6 | import userEvent from '@testing-library/user-event';
 7 | import { beforeEach, describe, expect, it, vi } from 'vitest';
 8 | import { LoginForm } from './LoginForm';
 9 |
10 | // `vi.hoisted` crea el espía ANTES de que Vitest sustituya el módulo; así el mismo `push`
11 | // que usa el componente es el que revisamos en las comprobaciones.
12 | const { push } = vi.hoisted(() => ({ push: vi.fn() }));
13 | // Se simula el enrutador de Next: en jsdom no hay navegación real, solo queremos saber a dónde iría.
14 | vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
15 | // Se simula la API: así controlamos qué responde el servidor sin red ni base de datos.
16 | vi.mock('@/lib/api/auth', () => ({ login: vi.fn(), registrar: vi.fn() }));
17 |
18 | describe('LoginForm (SWR-AUTH-005, SWR-AUTH-006)', () => {
19 |   beforeEach(() => {
20 |     vi.clearAllMocks();
21 |     localStorage.clear();
22 |   });
```

`apps/web/src/components/LoginForm.test.tsx` (líneas 38–72)

```ts
38 |   /**
39 |    * RTL-04 (candidata a explicar) · SWR-AUTH-006
40 |    * Regla: si la API rechaza las credenciales, el formulario muestra «Credenciales inválidas»
41 |    * dentro del propio componente (role="alert"), NO navega y NO deja ninguna sesión guardada.
42 |    */
43 |   it('RTL-04: con credenciales inválidas muestra «Credenciales inválidas» y no navega', async () => {
44 |     // ARRANGE (preparar) ------------------------------------------------------------------
45 |     // Crea un «usuario virtual» que escribe y hace clic como una persona real.
46 |     const usuario = userEvent.setup();
47 |     // Hace que la función `login` (la llamada a POST /auth/login) falle igual que la API real:
48 |     // con un ErrorApi de código CREDENCIALES_INVALIDAS, mensaje exacto y estado HTTP 401.
49 |     vi.mocked(login).mockRejectedValue(new ErrorApi('CREDENCIALES_INVALIDAS', 'Credenciales inválidas', 401));
50 |     // Dibuja el formulario dentro de los proveedores (AuthProvider + QueryClientProvider).
51 |     renderConProveedores(<LoginForm />);
52 |
53 |     // ACT (actuar) ------------------------------------------------------------------------
54 |     // Escribe un correo en el campo que tiene la etiqueta «Correo electrónico».
55 |     await usuario.type(screen.getByLabelText('Correo electrónico'), 'consumidor1@foodsave.test');
56 |     // Escribe una clave equivocada en el campo «Contraseña» (el mock la rechazará igual).
57 |     await usuario.type(screen.getByLabelText('Contraseña'), 'clave-equivocada');
58 |     // Pulsa el botón «Ingresar»: esto dispara el envío del formulario y, con él, `login(...)`.
59 |     await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));
60 |
61 |     // ASSERT (comprobar) ------------------------------------------------------------------
62 |     // `findByRole` espera (de forma asíncrona) a que aparezca un elemento con role="alert":
63 |     // el envío es asíncrono, así que el mensaje no existe en el primer instante.
64 |     const alerta = await screen.findByRole('alert');
65 |     // El texto del alert debe ser exactamente el mensaje del contrato, no uno inventado.
66 |     expect(alerta).toHaveTextContent('Credenciales inválidas');
67 |     // No se debe haber navegado a ninguna parte: el usuario sigue en el login.
68 |     expect(push).not.toHaveBeenCalled();
69 |     // Y no debe haber quedado sesión guardada: `getItem` devuelve null si la clave no existe.
70 |     expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
71 |   });
72 | });
```

### Código del componente que ejercita

`apps/web/src/components/LoginForm.tsx` (líneas 23–40)

```ts
23 | export function LoginForm({ aviso }: { aviso?: string }) {
24 |   const { iniciarSesion } = useAuth();
25 |   const router = useRouter();
26 |   const [error, setError] = useState<string | null>(null);
27 |
28 |   const form = useAppForm({
29 |     defaultValues: { correo: '', contrasena: '' },
30 |     validators: { onSubmit: esquema },
31 |     onSubmit: async ({ value }) => {
32 |       setError(null);
33 |       try {
34 |         await iniciarSesion(value.correo.trim(), value.contrasena);
35 |         router.push('/ofertas');
36 |       } catch (causa) {
37 |         setError(causa instanceof ErrorApi ? causa.message : 'Ocurrió un error inesperado');
38 |       }
39 |     }
40 |   });
```

`apps/web/src/components/LoginForm.tsx` (líneas 56–60)

```ts
56 |       {error && (
57 |         <Alert variant='destructive' role='alert'>
58 |           <AlertDescription>{error}</AlertDescription>
59 |         </Alert>
60 |       )}
```

### Línea por línea

| Líneas | Qué hace |
|---|---|
| 1–8 | Importa `login` (la llamada a `POST /auth/login`), `ErrorApi` (la clase de error de la API), `CLAVE_SESION` (la clave de `localStorage` donde se guarda la sesión), el render con proveedores, las utilidades de RTL y de Vitest, y el componente. |
| 12 | `vi.hoisted` crea el espía `push` **antes** de que Vitest sustituya los módulos. Sin esto, el `push` que usa el componente y el que revisa la prueba serían funciones distintas. |
| 14 | Simula `next/navigation`: `useRouter()` devuelve `{ push, replace }` falsos. En jsdom no hay navegación real; solo interesa saber **a dónde habría ido** el usuario. |
| 16 | Simula `@/lib/api/auth`: `login` y `registrar` pasan a ser funciones falsas (`vi.fn()`). Así se controla qué responde «el servidor» sin red. |
| 18–22 | `describe` del componente y `beforeEach`: antes de cada prueba se limpian las llamadas de los mocks (`vi.clearAllMocks`) y `localStorage`, para que ninguna prueba herede estado de otra. |
| 43 | Define el caso. El nombre cita el comportamiento: credenciales inválidas → mensaje y sin navegar. |
| 46 | **Arrange.** Crea el usuario virtual. |
| 49 | **Arrange.** Programa el falso `login` para que **rechace** su promesa con un `ErrorApi('CREDENCIALES_INVALIDAS', 'Credenciales inválidas', 401)`: mismo código, mensaje y estado HTTP que devuelve la API real. |
| 51 | **Arrange.** Dibuja `<LoginForm />` dentro de los proveedores. |
| 55 | **Act.** Escribe el correo en el campo cuya etiqueta es «Correo electrónico». |
| 57 | **Act.** Escribe una clave en el campo «Contraseña». Como `login` está simulado, esta clave en realidad no se valida: el mock rechazará cualquier valor. |
| 59 | **Act.** Pulsa «Ingresar». El formulario valida (ambos campos no vacíos, líneas 14–17 del componente), llama a `iniciarSesion` y esta llama a `login` (línea 50 de `auth-context.tsx`), que falla. |
| 64 | **Assert.** `findByRole('alert')` espera a que aparezca un elemento con `role="alert"`. El envío es asíncrono, así que el mensaje no existe en el primer instante. En el componente, ese rol lo tiene la `Alert` destructiva (líneas 56–60). |
| 66 | **Assert.** El texto del alert debe ser exactamente `Credenciales inválidas` (el mensaje del contrato, tomado de `causa.message`, línea 37 del componente). |
| 68 | **Assert.** `push` no fue llamado: no hubo navegación. |
| 70 | **Assert.** `localStorage.getItem(CLAVE_SESION)` es `null`: no se guardó sesión. En `auth-context.tsx` el guardado (línea 51) viene **después** de `await login(...)`, así que si `login` falla nunca se ejecuta. |

### Qué se simula y por qué

- **`login` (la API)**: para forzar el caso 401 sin servidor y sin depender de cuentas reales. El error es un `ErrorApi` real, así que el componente atraviesa su ruta real `causa instanceof ErrorApi`.
- **`next/navigation`**: en jsdom no existe el enrutador de Next; se sustituye por un espía para comprobar que **no** se navega.
- **No se simula**: el formulario, la validación, el `AuthProvider` ni `localStorage` (jsdom lo trae). Por eso la prueba sí detecta que la sesión se guardara por error.

### Qué cubre y qué no

Cubre el camino de error del componente y que no deja efectos secundarios (navegación, sesión). No prueba que el servidor devuelva realmente 401 (eso lo cubren UNIT-14 y las pruebas de API con Postman).

---

## RTL-10 · `OfertaForm` con precio de oferta igual o mayor al original (SWR-OFE-003)

**Comportamiento visible que valida:** si quien publica pone un precio de oferta igual (o mayor) al original, ve el mensaje «El precio de oferta debe ser menor al precio original» y la oferta **no se envía** al servidor.

### Código de la prueba

`apps/web/src/components/OfertaForm.test.tsx` (líneas 1–19)

```ts
 1 | import { listarMisSedes, publicarOferta } from '@/lib/api/ofertas';
 2 | import { renderConProveedores } from '@/test/render';
 3 | import { screen } from '@testing-library/react';
 4 | import userEvent from '@testing-library/user-event';
 5 | import { beforeEach, describe, expect, it, vi } from 'vitest';
 6 | import { OfertaForm } from './OfertaForm';
 7 |
 8 | // Se simula la API de ofertas: `listarMisSedes` llena el selector y `publicarOferta` es el
 9 | // espía que nos dirá si el formulario intentó enviar algo al servidor.
10 | vi.mock('@/lib/api/ofertas', () => ({ listarMisSedes: vi.fn(), publicarOferta: vi.fn(), listarOfertas: vi.fn() }));
11 |
12 | describe('OfertaForm (SWR-OFE-001, SWR-OFE-003)', () => {
13 |   beforeEach(() => {
14 |     vi.clearAllMocks();
15 |     vi.mocked(listarMisSedes).mockResolvedValue([
16 |       { id: 'sede-centro', nombre: 'Sede Centro' },
17 |       { id: 'sede-norte', nombre: 'Sede Norte' }
18 |     ]);
19 |   });
```

`apps/web/src/components/OfertaForm.test.tsx` (líneas 21–52)

```ts
21 |   /**
22 |    * RTL-10 (candidata a explicar) · SWR-OFE-003
23 |    * Regla de negocio: el precio de oferta debe ser MENOR al precio original. Si es igual (o
24 |    * mayor), el navegador lo detecta antes de enviar, muestra el mensaje y no llama a la API.
25 |    */
26 |   it('RTL-10: con precio de oferta igual al original muestra el error de precio y no envía', async () => {
27 |     // ARRANGE (preparar) ------------------------------------------------------------------
28 |     // Crea el «usuario virtual» que teclea y hace clic.
29 |     const usuario = userEvent.setup();
30 |     // Dibuja el formulario de publicación dentro de los proveedores que necesita.
31 |     renderConProveedores(<OfertaForm />);
32 |
33 |     // ACT (actuar) ------------------------------------------------------------------------
34 |     // Escribe 8000 en «Precio original».
35 |     await usuario.type(screen.getByLabelText('Precio original'), '8000');
36 |     // Escribe también 8000 en «Precio de oferta»: es IGUAL, así que viola la regla (debe ser menor).
37 |     await usuario.type(screen.getByLabelText('Precio de oferta'), '8000');
38 |     // Escribe una cantidad válida (5) para que el único problema de precio sea el que se prueba.
39 |     await usuario.type(screen.getByLabelText('Cantidad'), '5');
40 |     // Pulsa «Publicar»: dispara la validación de todos los campos al enviar.
41 |     await usuario.click(screen.getByRole('button', { name: 'Publicar' }));
42 |
43 |     // ASSERT (comprobar) ------------------------------------------------------------------
44 |     // El mensaje aparece tras el envío (validación asíncrona), por eso `findByText` y no `getByText`.
45 |     // Debe ser exactamente el texto del contrato / BB-06.
46 |     expect(await screen.findByText('El precio de oferta debe ser menor al precio original')).toBeInTheDocument();
47 |     // Como el formulario es inválido, NUNCA debió llamar a la API de publicación.
48 |     // (El producto, el vencimiento y la sede están vacíos y también muestran su error: da igual,
49 |     // cada campo se valida por separado en cada envío.)
50 |     expect(publicarOferta).not.toHaveBeenCalled();
51 |   });
52 | });
```

### Código que ejercita

`apps/web/src/lib/ofertas/validar-formulario.ts` (líneas 13–15)

```ts
13 | /** Mensajes exactos de «Datos y mensajes» (BB-06, RTL-10) y los de campos obligatorios. */
14 | export const MENSAJE_CANTIDAD = 'La cantidad debe ser un número entero positivo';
15 | export const MENSAJE_PRECIO = 'El precio de oferta debe ser menor al precio original';
```

`apps/web/src/lib/ofertas/validar-formulario.ts` (líneas 35–41)

```ts
35 |   if (precioOferta === undefined) {
36 |     errores.precioOferta = 'El precio de oferta es obligatorio';
37 |   } else if (!Number.isInteger(precioOferta)) {
38 |     errores.precioOferta = 'El precio debe ser un número entero, en pesos';
39 |   } else if (precioOriginal !== undefined && precioOferta >= precioOriginal) {
40 |     errores.precioOferta = MENSAJE_PRECIO;
41 |   }
```

`apps/web/src/components/OfertaForm.tsx` (líneas 16–26)

```ts
16 | /**
17 |  * Validador de un campo para cada envío. Se valida por campo (y no con un validador del
18 |  * formulario) porque así el error de una regla entre campos —el precio de oferta contra el
19 |  * original— se recalcula en cada envío aunque el usuario haya corregido el otro campo.
20 |  */
21 | function validarCampo(campo: keyof ValoresOferta) {
22 |   return ({ fieldApi }: { fieldApi: { form: { state: { values: ValoresOferta } } } }) => {
23 |     const mensaje = validarFormularioOferta(fieldApi.form.state.values)[campo];
24 |     return mensaje ? { message: mensaje } : undefined;
25 |   };
26 | }
```

`apps/web/src/components/OfertaForm.tsx` (líneas 74–79)

```ts
74 |   const form = useAppForm({
75 |     defaultValues: VALORES_INICIALES,
76 |     // Cada pulsación de «Publicar» vuelve a validar todos los campos (ver `validarCampo`).
77 |     canSubmitWhenInvalid: true,
78 |     onSubmit: async ({ value }) => {
79 |       setError(null);
```

### Línea por línea

| Líneas | Qué hace |
|---|---|
| 1–6 | Importa las dos funciones de la API de ofertas, el render con proveedores, utilidades de RTL/Vitest y el componente. |
| 10 | Simula `@/lib/api/ofertas` con tres funciones falsas. `listarMisSedes` llenará el selector de sede; `publicarOferta` es el **espía clave**: si se llama, el formulario intentó enviar algo al servidor. |
| 13–19 | `beforeEach`: limpia los mocks y hace que `listarMisSedes` devuelva dos sedes (Sede Centro y Sede Norte), como un dueño real. |
| 26 | Define el caso, citando la regla: precio igual al original → error y no se envía. |
| 29 | **Arrange.** Usuario virtual. |
| 31 | **Arrange.** Dibuja `<OfertaForm />`. Muestra el formulario de publicación (el componente solo muestra la confirmación después de publicar). |
| 35 | **Act.** Escribe `8000` en «Precio original». |
| 37 | **Act.** Escribe también `8000` en «Precio de oferta»: es **igual**, así que viola la regla. |
| 39 | **Act.** Escribe `5` en «Cantidad» para que el único error de cantidad no se mezcle con lo que se prueba. |
| 41 | **Act.** Pulsa «Publicar». Con `canSubmitWhenInvalid: true` (línea 77 del componente) cada pulsación dispara la validación de todos los campos aunque haya errores. |
| 46 | **Assert.** `findByText` espera al mensaje exacto del contrato / BB-06. Viene de `MENSAJE_PRECIO` (línea 15 de `validar-formulario.ts`), asignado cuando `precioOferta >= precioOriginal` (línea 39). |
| 50 | **Assert.** `publicarOferta` **no** fue llamada: el formulario inválido nunca llegó a enviar. |

Nota sobre lo que *no* se comprueba y es intencional: producto, vencimiento y sede quedan vacíos y también muestran su propio error («El producto es obligatorio», etc.). La prueba no lo afirma porque su objetivo es la regla de precio; el comentario de las líneas 47–49 lo deja dicho.

### Qué se simula y por qué

- **`publicarOferta` y `listarMisSedes`**: son las llamadas al servidor. Se simulan para no depender de red y, sobre todo, para poder afirmar que `publicarOferta` **no se llamó**, que es la prueba de que la validación del navegador frenó el envío.
- **No se simula**: la validación (`validarFormularioOferta`), el formulario ni sus campos. La regla que se verifica es la real.

### Qué cubre y qué no

- Cubre el espejo en el navegador de la regla de la API. El mismo caso en el servidor lo cubren UNIT-05 (`validarOferta`) y `BB-06`.
- **Precio igual o mayor**: la regla es `>=` (línea 39), por eso el nombre dice «igual o mayor»; la prueba ejecuta el caso «igual», que es la frontera.
- Limitación conocida (la misma del Bloque C de caja blanca): el formulario tampoco rechaza precios negativos o cero (`validar-formulario.ts`, líneas 21–22).

---

## RTL-12 · `ReservaForm` con botón deshabilitado mientras envía (SWR-RES-001 y SWR-RES-005)

**Comportamiento visible que valida:** al pulsar «Reservar», el botón queda **deshabilitado** hasta que el servidor responde (así un doble clic no crea dos reservas); después aparece «Reserva confirmada» con el plazo de retiro y el botón vuelve a estar habilitado.

### Código de la prueba

`apps/web/src/components/ReservaForm.test.tsx` (líneas 1–13)

```ts
 1 | import { crearReserva, type Reserva } from '@/lib/api/reservas';
 2 | import { ErrorApi } from '@/lib/api-client';
 3 | import { ofertaDePrueba, renderConProveedores } from '@/test/render';
 4 | import { act, screen } from '@testing-library/react';
 5 | import userEvent from '@testing-library/user-event';
 6 | import { beforeEach, describe, expect, it, vi } from 'vitest';
 7 | import { ReservaForm } from './ReservaForm';
 8 |
 9 | // Se simula la API de reservas: `crearReserva` es POST /reservas.
10 | vi.mock('@/lib/api/reservas', () => ({ crearReserva: vi.fn() }));
11 |
12 | describe('ReservaForm (SWR-RES-001, SWR-RES-002, SWR-RES-003, SWR-RES-005)', () => {
13 |   beforeEach(() => vi.clearAllMocks());
```

`apps/web/src/components/ReservaForm.test.tsx` (líneas 27–82)

```ts
27 |   /**
28 |    * RTL-12 (candidata a explicar) · SWR-RES-001 / SWR-RES-005
29 |    * Regla: mientras la reserva se envía el botón queda DESHABILITADO (evita reservar dos veces
30 |    * con un doble clic); al terminar se muestra «Reserva confirmada» con el plazo de retiro y el
31 |    * botón vuelve a estar habilitado.
32 |    */
33 |   it('RTL-12: deshabilita el botón mientras envía y luego muestra «Reserva confirmada» con el plazo', async () => {
34 |     // ARRANGE (preparar) ------------------------------------------------------------------
35 |     const usuario = userEvent.setup();
36 |     // Variable que guardará la función que «resuelve» la promesa; la llamaremos a mano más abajo.
37 |     let resolverReserva!: (reserva: Reserva) => void;
38 |     // `crearReserva` devuelve una promesa que NO se resuelve sola: nosotros decidimos cuándo
39 |     // «responde el servidor». Así podemos observar el estado intermedio de «enviando».
40 |     vi.mocked(crearReserva).mockReturnValue(new Promise<Reserva>((resolver) => (resolverReserva = resolver)));
41 |     // Dibuja el formulario con una oferta de prueba (Pan integral, Sede Centro, 5 disponibles).
42 |     renderConProveedores(<ReservaForm oferta={ofertaDePrueba()} />);
43 |
44 |     // ACT 1 (actuar: enviar) --------------------------------------------------------------
45 |     // Escribe la cantidad 2 en el campo «Cantidad».
46 |     await usuario.type(screen.getByLabelText('Cantidad'), '2');
47 |     // Pulsa «Reservar»: se llama a `crearReserva`, pero la promesa sigue pendiente.
48 |     await usuario.click(screen.getByRole('button', { name: 'Reservar' }));
49 |
50 |     // ASSERT 1 (comprobar el estado «enviando») ------------------------------------------
51 |     // Con la respuesta pendiente, el botón debe estar deshabilitado.
52 |     expect(screen.getByRole('button', { name: 'Reservar' })).toBeDisabled();
53 |     // Y todavía no debe existir el mensaje de confirmación.
54 |     expect(screen.queryByText('Reserva confirmada')).not.toBeInTheDocument();
55 |
56 |     // ACT 2 (actuar: el servidor responde) -------------------------------------------------
57 |     // `act` avisa a React de que se va a actualizar el estado fuera de una interacción de usuario.
58 |     await act(async () => {
59 |       // «El servidor» responde 201 con la reserva creada y su plazo de retiro (ISO 8601).
60 |       resolverReserva({
61 |         id: 'reserva-1',
62 |         ofertaId: 'oferta-1',
63 |         oferta: { id: 'oferta-1', producto: 'Pan integral', precioOferta: 4000, sede: { id: 'sede-centro', nombre: 'Sede Centro' } },
64 |         cantidad: 2,
65 |         estado: 'RESERVADA',
66 |         plazoRetiro: '2026-11-18T23:00:00.000Z',
67 |         createdAt: '2026-11-18T11:00:00.000Z'
68 |       });
69 |     });
70 |
71 |     // ASSERT 2 (comprobar el resultado final) ---------------------------------------------
72 |     // Busca el título de la confirmación y sube hasta el contenedor con role="status".
73 |     // OJO: hay DOS role="status" en el formulario (este y el texto oculto del botón de carga),
74 |     // por eso se localiza por su texto y no con `getByRole('status')` a secas.
75 |     const confirmacion = (await screen.findByText('Reserva confirmada')).closest('[role="status"]');
76 |     expect(confirmacion).toBeInTheDocument();
77 |     // La confirmación debe informar el plazo de retiro.
78 |     expect(confirmacion).toHaveTextContent('Plazo de retiro:');
79 |     // Terminó el envío: el botón vuelve a estar habilitado.
80 |     expect(screen.getByRole('button', { name: 'Reservar' })).toBeEnabled();
81 |   });
82 | });
```

### Código que ejercita

`apps/web/src/components/forms/submit-button.tsx` (líneas 7–29)

```ts
 7 | /** Submit button that shows a no-layout-shift spinner while the form submits. */
 8 | export function SubmitButton({
 9 |   children,
10 |   disabled,
11 |   ...props
12 | }: React.ComponentProps<typeof LoadingButton>) {
13 |   const form = useFormContext();
14 |
15 |   return (
16 |     <form.Subscribe selector={(state) => state.isSubmitting}>
17 |       {(isSubmitting) => (
18 |         <LoadingButton
19 |           type='submit'
20 |           {...props}
21 |           loading={isSubmitting}
22 |           disabled={disabled || isSubmitting}
23 |         >
24 |           {children}
25 |         </LoadingButton>
26 |       )}
27 |     </form.Subscribe>
28 |   );
29 | }
```

`apps/web/src/components/ReservaForm.tsx` (líneas 34–48)

```ts
34 |   const form = useAppForm({
35 |     defaultValues: { cantidad: undefined as number | undefined },
36 |     canSubmitWhenInvalid: true,
37 |     onSubmit: async ({ value }) => {
38 |       setError(null);
39 |       setReserva(null);
40 |       try {
41 |         const creada = await crearReserva({ ofertaId: oferta.id, cantidad: value.cantidad as number });
42 |         setReserva(creada);
43 |         onReservada?.(creada);
44 |       } catch (causa) {
45 |         setError(causa instanceof ErrorApi ? causa.message : 'Ocurrió un error inesperado');
46 |       }
47 |     }
48 |   });
```

`apps/web/src/components/ReservaForm.tsx` (líneas 68–77)

```ts
68 |       {reserva && (
69 |         <Alert role='status'>
70 |           <AlertTitle>Reserva confirmada</AlertTitle>
71 |           <AlertDescription>
72 |             {reserva.cantidad} × {reserva.oferta.producto} en {reserva.oferta.sede.nombre}.{' '}
73 |             <strong>Plazo de retiro: {formatFechaHora(reserva.plazoRetiro)}</strong>. Paga y recoge
74 |             en la sede antes de ese plazo.
75 |           </AlertDescription>
76 |         </Alert>
77 |       )}
```

### Línea por línea

| Líneas | Qué hace |
|---|---|
| 1–7 | Importa `crearReserva` (la llamada a `POST /reservas`) y su tipo `Reserva`, `ErrorApi`, la oferta de prueba, `act`, el render y el componente. |
| 10 | Simula `@/lib/api/reservas`: `crearReserva` pasa a ser una función falsa. |
| 13 | `beforeEach`: limpia los mocks. |
| 33 | Define el caso: botón deshabilitado mientras envía y luego confirmación con plazo. |
| 35 | **Arrange.** Usuario virtual. |
| 37 | Declara la variable `resolverReserva`, que guardará la función que **resuelve** la promesa. El `!` le dice a TypeScript que se asignará antes de usarse. |
| 40 | **Arrange (clave).** `crearReserva` devuelve una promesa que **no se resuelve sola**: la función de resolución se guarda en `resolverReserva`. Es la prueba quien decide cuándo «responde el servidor». Esto permite observar el estado intermedio de «enviando», que con una respuesta inmediata sería imposible de ver. |
| 42 | **Arrange.** Dibuja `<ReservaForm oferta={ofertaDePrueba()} />` (Pan integral, Sede Centro, 5 disponibles; `render.tsx`, líneas 37–52). |
| 46 | **Act 1.** Escribe `2` en «Cantidad». |
| 48 | **Act 1.** Pulsa «Reservar». El formulario valida (entero positivo, líneas 87–91 del componente), pone `isSubmitting = true` y llama a `crearReserva`; la promesa sigue pendiente. |
| 52 | **Assert 1.** El botón «Reservar» está deshabilitado. En `SubmitButton` (líneas 21–22) `disabled={disabled \|\| isSubmitting}`: mientras el envío está en curso, `isSubmitting` es verdadero. |
| 54 | **Assert 1.** Todavía no existe «Reserva confirmada»: el servidor no ha respondido. `queryByText` devuelve `null` en vez de fallar, que es lo que se espera aquí. |
| 58–69 | **Act 2.** `act(async …)` avisa a React de que el estado va a cambiar fuera de una interacción del usuario. Dentro se llama a `resolverReserva(...)` con una reserva completa (`RESERVADA`, 2 unidades, `plazoRetiro` en ISO 8601): equivale a que el servidor respondiera 201. |
| 75 | **Assert 2.** Espera el texto «Reserva confirmada» y sube con `closest('[role="status"]')` hasta el contenedor de la confirmación. No se usa `getByRole('status')` a secas porque hay **dos** `role="status"` en el formulario (la confirmación y el anuncio oculto del botón de carga). |
| 76 | **Assert 2.** El contenedor existe. |
| 78 | **Assert 2.** Contiene «Plazo de retiro:»: el consumidor ve hasta cuándo puede recoger (SWR-RES-005). |
| 80 | **Assert 2.** El botón vuelve a estar habilitado: terminó el envío (`isSubmitting` falso). |

### Qué se simula y por qué

- **`crearReserva` con una promesa pendiente controlada**: es lo único que permite probar un estado transitorio sin `setTimeout` ni esperas arbitrarias; la prueba es determinista y rápida.
- **El plazo `2026-11-18T23:00:00.000Z`**: es un dato de entrada fijo; la prueba no calcula el plazo (esa regla es `calcularPlazoRetiro`, Bloque A de caja blanca), solo comprueba que el componente **lo muestre**.
- **No se simula**: `SubmitButton`, `LoadingButton` ni el formulario; se comprueba la deshabilitación real.

### Qué cubre y qué no

- Cubre la protección contra doble envío en la interfaz y la confirmación visible.
- No prueba que el servidor impida de verdad la doble reserva ni la sobreventa: eso depende de la transacción (`ReservasService.crear`) y no tiene prueba de concurrencia en la matriz.
- El caso de error 409 («No hay unidades suficientes») es RTL-11, en el mismo archivo.
