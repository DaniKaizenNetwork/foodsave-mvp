# Caja blanca: calcularPlazoRetiro, verificarReserva y validarOferta

Este documento explica, con el código real del repositorio, las tres funciones de dominio que se analizan en la hoja «Caja blanca» de `docs/calidad/04_Matriz_Pruebas.xlsx` (bloques A, B y C). Para cada una se indica la decisión que contiene, sus caminos, los datos que ejecutan cada camino, las fronteras, la prueba que cubre cada rama, lo que no está cubierto y qué defecto se escondería si solo se probara el caso correcto.

Cómo leerlo:

- Los números de línea son los del archivo en esta rama (`develop`); si el archivo cambia, los números se desplazan.
- Los nombres de prueba son los textos exactos de los `it(...)` de los archivos `*.spec.ts`.
- «Estado» de cada prueba: las tres suites pasan (ver `docs/calidad/06_Pruebas_Unitarias/resultado_jest_cobertura.txt`); estas funciones tienen 100 % de cobertura de sentencias, ramas, funciones y líneas.
- Las funciones son puras: el reloj entra por el parámetro `ahora` (regla de diseño de `CLAUDE.md`), por eso las pruebas fijan la hora y no dependen del reloj del sistema.

---

## Bloque A · `calcularPlazoRetiro` (SWR-RES-005)

### Código real

`apps/api/src/reservas/plazo-retiro.ts` (líneas 1–21)

```ts
 1 | const DOCE_HORAS_MS = 12 * 60 * 60 * 1000;
 2 |
 3 | /**
 4 |  * SWR-RES-005 (RN-02): el plazo de retiro es el menor entre 12 horas desde la reserva, la
 5 |  * hora de cierre de la sede del día de la reserva y la fecha y hora de vencimiento del
 6 |  * producto. `cierreSede` es null en las sedes 24 h: no limita.
 7 |  *
 8 |  * El reloj llega como parámetro (`ahora`); la función no lee la hora del sistema.
 9 |  * Limitación conocida (Bloque A): si la sede ya cerró o el producto ya venció, devuelve
10 |  * un plazo anterior a `ahora`; ese caso lo evita la verificación de la reserva.
11 |  */
12 | export function calcularPlazoRetiro(
13 |   ahora: Date,
14 |   cierreSede: Date | null,
15 |   vencimiento: Date,
16 | ): Date {
17 |   let plazo = new Date(ahora.getTime() + DOCE_HORAS_MS);
18 |   if (cierreSede !== null && cierreSede < plazo) plazo = cierreSede;
19 |   if (vencimiento < plazo) plazo = vencimiento;
20 |   return new Date(plazo.getTime());
21 | }
```

### Decisión o condición

Son **tres decisiones en secuencia** que van reduciendo un plazo candidato:

1. Línea 17: no es un `if`, fija el punto de partida: `ahora + 12 h`.
2. Línea 18: `cierreSede !== null && cierreSede < plazo`. ¿La sede tiene hora de cierre (no es 24 h) **y** ese cierre es anterior al plazo actual? Es una condición compuesta: `&&` abre dos sub-condiciones (¿hay cierre?, ¿cierra antes?).
3. Línea 19: `vencimiento < plazo`. ¿El producto vence antes que el plazo que ya quedó?

La regla de negocio (RN-02) es «el plazo es el **menor** de los tres valores»; el código lo logra comparando de uno en uno y quedándose con el menor.

### Ramas o caminos posibles

| Camino | Línea 18 | Línea 19 | Resultado |
|---|---|---|---|
| **N**: sede 24 h | `cierreSede === null` → falso (no entra, y `cierreSede < plazo` ni se evalúa) | `vencimiento < plazo` falso | `ahora + 12 h` |
| **FF** | falso (el cierre no es menor que `ahora + 12 h`) | falso | `ahora + 12 h` |
| **TF** | verdadero → plazo = cierre | falso | el cierre |
| **TT** | verdadero → plazo = cierre | verdadero → plazo = vencimiento | el vencimiento (que es anterior al cierre) |
| **FT** | falso | verdadero → plazo = vencimiento | el vencimiento |

(La primera letra es el resultado de la línea 18 y la segunda el de la línea 19. N es el caso «sin cierre», que la matriz separa porque en él la primera sub-condición ya es falsa.)

Además hay un camino «combinado» no nombrado en la matriz: **sede 24 h con vencimiento limitante** (N + vencimiento menor). Entra por la línea 19 con `cierreSede === null`.

### Datos que ejecutan cada camino

Todas las horas son de Bogotá (UTC-5) del 17-nov-2026; `ahora + 12 h` se calcula sobre la primera columna.

| Camino | `ahora` | `cierreSede` | `vencimiento` | Plazo esperado |
|---|---|---|---|---|
| FF | 07:00 | 20:00 | 23:00 | 19:00 (12 h) |
| TF | 17:00 | 20:00 | 23:00 | 20:00 (cierre; 12 h sería 05:00 del día siguiente) |
| TT | 10:00 | 21:00 | 15:00 | 15:00 (el cierre 21:00 < 22:00, pero el vencimiento 15:00 es aún menor) |
| FT | 08:00 | 22:00 | 15:00 | 15:00 (el cierre 22:00 no es menor que 20:00, vence 15:00 sí) |
| N | 07:00 | `null` | 23:00 | 19:00 |
| N + vencimiento | 07:00 | `null` | 09:30 | 09:30 |

### Valor límite o frontera

- **Cierre igual al límite de 12 h** (07:00 + 12 h = 19:00 y cierre = 19:00). La condición `<` es falsa, el plazo queda como estaba y el resultado es 19:00 igual: cambiar `<` por `<=` no altera el resultado, es un **mutante equivalente** (sin efecto observable).
- **Vencimiento igual al plazo previo**: igual razonamiento.
- La frontera que sí importa es el orden: el vencimiento se compara contra el plazo *ya reducido* por el cierre, no contra `ahora + 12 h`; por eso TT devuelve el vencimiento y no el cierre.

### Qué prueba cubre cada rama

Archivo: `apps/api/src/reservas/plazo-retiro.spec.ts`.

| Camino | ID | Nombre exacto del test |
|---|---|---|
| FF | UNIT-01 | `UNIT-01 / TC-RES-002: limita las 12 horas (07:00, cierre 20:00, vence 23:00 → 19:00)` |
| TF | UNIT-02 | `UNIT-02 / TC-RES-001: limita el cierre de la sede (17:00, cierre 20:00, vence 23:00 → 20:00)` |
| TT | UNIT-03 | `UNIT-03 / TC-RES-003: limita el vencimiento tras el cierre (10:00, cierre 21:00, vence 15:00 → 15:00)` |
| FT | WB-01 | `WB-01: limita el vencimiento sin que limite el cierre (08:00, cierre 22:00, vence 15:00 → 15:00)` |
| N | WB-07 | `WB-07: sede 24 h (cierre null) no limita (07:00, vence 23:00 → 19:00)` |
| N + vencimiento | (sin ID en la matriz) | `sede 24 h con vencimiento cercano: limita el vencimiento` |
| Frontera cierre = 12 h | (sin ID) | `frontera: cierre igual al límite de 12 h (19:00 = 19:00) devuelve ese mismo instante` |
| Pureza | (sin ID) | `no modifica las fechas recibidas y devuelve una fecha nueva` |

Nota: la hoja «Caja blanca» dice que N + vencimiento no tiene prueba propia; en la implementación se añadió la prueba `sede 24 h con vencimiento cercano…`, así que ese camino **sí quedó cubierto**. La matriz no se modificó (la actualiza el equipo).

### Qué camino NO está cubierto

- **Plazo anterior a `ahora`**: si la sede ya cerró (cierre < `ahora`) o el producto ya venció (vencimiento < `ahora`), la función devuelve esa fecha pasada sin avisar (líneas 18 y 19 la aceptan porque es menor). No hay prueba porque es una **limitación declarada** en el comentario (líneas 9–10): ese caso lo evita `verificarReserva` (producto vencido) y la lógica de cierre, antes de llamar a esta función.
- **Fechas inválidas** (`new Date('x')`): toda comparación con `Invalid Date` es falsa, así que el resultado sería inválido sin error. Tampoco hay prueba ni validación (el contrato solo entrega fechas válidas desde la base).

### Defecto que quedaría oculto si solo se probara el caso correcto

Con solo FF (el caso «normal», 12 h) el cálculo parece correcto, pero pasarían inadvertidos:

- escribir `>` en lugar de `<` en la línea 18 o 19 (devolvería el **mayor** y el plazo de retiro superaría el cierre o el vencimiento);
- invertir el orden de las líneas 18 y 19 (el vencimiento se compararía antes que el cierre y el cierre podría ganarle a un vencimiento más temprano);
- olvidar el caso de sede 24 h y comparar contra un `cierreSede` nulo (en JavaScript `null < fecha` es `true` porque `null` se convierte en 0: el plazo pasaría a ser `null`, es decir, una reserva sin plazo). Esa es justamente la razón de la comprobación `cierreSede !== null` y de WB-07.

---

## Bloque B · `verificarReserva` (SWR-RES-001 y SWR-RES-002)

### Código real

`apps/api/src/reservas/verificar-reserva.ts` (líneas 16–32)

```ts
16 | /**
17 |  * SWR-RES-001 y SWR-RES-002: antes de crear una reserva verifica, en este orden, que
18 |  * (1) la cantidad sea un entero positivo, (2) la oferta esté activa, (3) el producto no
19 |  * esté vencido (vencimiento <= ahora se rechaza) y (4) la cantidad no supere las unidades
20 |  * disponibles (cantidad == disponible se acepta). Devuelve el primer error que encuentra.
21 |  */
22 | export function verificarReserva(
23 |   oferta: OfertaReservable,
24 |   cantidad: number,
25 |   ahora: Date,
26 | ): ResultadoVerificacion {
27 |   if (!Number.isInteger(cantidad) || cantidad <= 0) return 'CANTIDAD_INVALIDA';
28 |   if (oferta.estado !== 'ACTIVA') return 'OFERTA_NO_ACTIVA';
29 |   if (oferta.vencimiento <= ahora) return 'PRODUCTO_VENCIDO';
30 |   if (cantidad > oferta.disponible) return 'STOCK_INSUFICIENTE';
31 |   return 'OK';
32 | }
```

(Los tipos `OfertaReservable` y `ResultadoVerificacion` están en las líneas 3–14 del mismo archivo.)

### Decisión o condición

**Cuatro condiciones encadenadas**, evaluadas en orden; la primera que se cumple termina la función (`return` temprano):

| Línea | Condición | Resultado si es verdadera |
|---|---|---|
| 27 | `!Number.isInteger(cantidad) \|\| cantidad <= 0` | `CANTIDAD_INVALIDA` |
| 28 | `oferta.estado !== 'ACTIVA'` | `OFERTA_NO_ACTIVA` |
| 29 | `oferta.vencimiento <= ahora` | `PRODUCTO_VENCIDO` |
| 30 | `cantidad > oferta.disponible` | `STOCK_INSUFICIENTE` |
| 31 | (ninguna se cumplió) | `OK` |

La línea 27 es compuesta: un número que no es entero (decimal, `NaN`, `Infinity`) o que es cero/negativo.

### Ramas o caminos posibles

Cinco caminos: `CANTIDAD_INVALIDA`, `OFERTA_NO_ACTIVA`, `PRODUCTO_VENCIDO`, `STOCK_INSUFICIENTE` y `OK`.

### Datos que ejecutan cada camino

Con `ahora = 17-nov-2026 10:00 (Bogotá)`, oferta base `ACTIVA`, `disponible = 5`, vence al día siguiente:

| Camino | Datos |
|---|---|
| `CANTIDAD_INVALIDA` | cantidad 0 (también −1, 1.5, NaN, Infinity) |
| `OFERTA_NO_ACTIVA` | estado `CERRADA`, cantidad 1 (también `AGOTADA`) |
| `PRODUCTO_VENCIDO` | `vencimiento = ahora`, cantidad 1 |
| `STOCK_INSUFICIENTE` | `disponible = 5`, cantidad 6 (también `disponible = 0`, cantidad 1) |
| `OK` | `disponible = 5`, cantidad 5, oferta activa y vigente |

### Valor límite o frontera

- **`vencimiento == ahora`**: se rechaza porque la línea 29 usa `<=`. Un producto que vence en este mismo instante ya no se puede reservar.
- **`cantidad == disponible`**: se acepta porque la línea 30 usa `>` y no `>=`. Se puede reservar todo el stock.
- **cantidad == 0 y == 1**: 0 se rechaza, 1 es la mínima válida.
- Orden de las condiciones: cuando fallan varias a la vez, gana la primera de la tabla.

### Qué prueba cubre cada rama

Archivo: `apps/api/src/reservas/verificar-reserva.spec.ts`.

| Camino | ID | Nombre exacto del test |
|---|---|---|
| `STOCK_INSUFICIENTE` | UNIT-07 | `UNIT-07: una cantidad mayor al stock se rechaza con STOCK_INSUFICIENTE` |
| `CANTIDAD_INVALIDA` | WB-02 | `WB-02: cantidad 0 se rechaza con CANTIDAD_INVALIDA` |
| `OFERTA_NO_ACTIVA` | WB-03 | `WB-03: una oferta CERRADA se rechaza con OFERTA_NO_ACTIVA` |
| `PRODUCTO_VENCIDO` (frontera) | WB-04 | `WB-04: frontera, vencimiento igual a ahora se rechaza con PRODUCTO_VENCIDO` |
| `OK` (frontera) | WB-05 | `WB-05: frontera, cantidad igual al disponible se acepta` |
| `CANTIDAD_INVALIDA` (más valores) | (sin ID) | `rechaza la cantidad %p con CANTIDAD_INVALIDA` (parametrizada con −1, 1.5, NaN, Infinity) |
| `OFERTA_NO_ACTIVA` (AGOTADA) | (sin ID) | `una oferta AGOTADA se rechaza con OFERTA_NO_ACTIVA` |
| `STOCK_INSUFICIENTE` (disponible 0) | (sin ID) | `una oferta ACTIVA con 0 unidades se rechaza con STOCK_INSUFICIENTE` |
| Prioridad entre errores | (sin ID) | `prioridad entre errores: cantidad, luego oferta no activa, luego vencido, luego stock` |

Nota: la hoja «Caja blanca» indica como no cubierta «la prioridad entre mensajes cuando fallan dos condiciones a la vez»; la última prueba de la tabla **sí la cubre** (se añadió al implementar). La matriz no se modificó.

### Qué camino NO está cubierto

- **Concurrencia entre dos reservas simultáneas** (SWR-RES-008, fuera del MVP): la función es pura y no puede detectarla. La protección está en otra capa: `ReservasService.crear` descuenta con `updateMany ... WHERE disponible >= n` dentro de la transacción (`apps/api/src/reservas/reservas.service.ts`, líneas 84–88), pero **no hay prueba de concurrencia** en la matriz.
- **`ahora` o `vencimiento` inválidos**: con `Invalid Date`, `vencimiento <= ahora` es falso y la función seguiría hacia el stock.
- **`estado` fuera del tipo** (p. ej. `EXPIRADA`): cae en `OFERTA_NO_ACTIVA` por la línea 28; no hay prueba específica porque el tipo `OfertaReservable` solo admite `ACTIVA | CERRADA | AGOTADA`.

### Defecto que quedaría oculto si solo se probara el caso correcto

Con una reserva válida (`OK`) todo parece bien, pero:

- `>=` en lugar de `>` (línea 30) impediría reservar **todo** el stock; solo lo detecta WB-05.
- `<` en lugar de `<=` (línea 29) dejaría reservar un producto que vence en este instante; solo lo detecta WB-04.
- Quitar la línea 27 dejaría pasar cantidades decimales, negativas o `NaN`: el stock podría **aumentar** al restar una cantidad negativa.
- Alterar el orden de las líneas cambiaría el mensaje que ve el usuario cuando hay varios problemas (lo cubre la prueba de prioridad).
- Dos reservas simultáneas de la última unidad: el caso correcto de una sola reserva nunca lo muestra (sobreventa).

---

## Bloque C · `validarOferta` (SWR-OFE-003)

### Código real

`apps/api/src/ofertas/validar-oferta.ts` (líneas 13–32)

```ts
13 | /**
14 |  * SWR-OFE-003: antes de publicar se verifica que (a) la cantidad sea un entero positivo y
15 |  * (b) el precio de oferta sea estrictamente menor al original. Se evalúa en ese orden.
16 |  *
17 |  * Limitación conocida (Bloque C de caja blanca): no valida precios negativos, cero o no
18 |  * numéricos; el controlador solo comprueba que sean números.
19 |  */
20 | export function validarOferta({
21 |   cantidad,
22 |   precioOriginal,
23 |   precioOferta,
24 | }: DatosOferta): ResultadoValidacionOferta {
25 |   if (!Number.isInteger(cantidad) || cantidad <= 0) {
26 |     return { valido: false, codigo: 'CANTIDAD_INVALIDA' };
27 |   }
28 |   if (precioOferta >= precioOriginal) {
29 |     return { valido: false, codigo: 'PRECIO_INVALIDO' };
30 |   }
31 |   return { valido: true };
32 | }
```

(Los tipos `DatosOferta` y `ResultadoValidacionOferta` están en las líneas 3–11.)

### Decisión o condición

**Dos condiciones en orden**:

| Línea | Condición | Resultado si es verdadera |
|---|---|---|
| 25 | `!Number.isInteger(cantidad) \|\| cantidad <= 0` | `{ valido: false, codigo: 'CANTIDAD_INVALIDA' }` |
| 28 | `precioOferta >= precioOriginal` | `{ valido: false, codigo: 'PRECIO_INVALIDO' }` |
| 31 | (ninguna) | `{ valido: true }` |

### Ramas o caminos posibles

Tres caminos: `CANTIDAD_INVALIDA`, `PRECIO_INVALIDO` y válido.

### Datos que ejecutan cada camino

| Camino | Datos |
|---|---|
| `CANTIDAD_INVALIDA` | cantidad 0, 1.5 o −1 (precios 8000 y 4000) |
| `PRECIO_INVALIDO` | cantidad 5, original 8000, oferta 8000 |
| Válido | cantidad 1, original 8000, oferta 7999 |

### Valor límite o frontera

- **Cantidad 0 / 1**: 0 es inválida, 1 es la mínima válida.
- **Precio de oferta 8000 / 7999 con original 8000**: «igual» se rechaza (la línea 28 usa `>=`), «un peso menos» se acepta.
- **Orden**: cuando fallan cantidad y precio a la vez, gana la cantidad (línea 25 antes que 28).

### Qué prueba cubre cada rama

Archivo: `apps/api/src/ofertas/validar-oferta.spec.ts`.

| Camino | ID | Nombre exacto del test |
|---|---|---|
| `CANTIDAD_INVALIDA` (cero) | UNIT-04 | `UNIT-04: rechaza cantidad cero con CANTIDAD_INVALIDA` |
| `PRECIO_INVALIDO` (frontera) | UNIT-05 | `UNIT-05: rechaza un precio de oferta igual al original con PRECIO_INVALIDO` |
| Válido (mínimo) | UNIT-06 | `UNIT-06: acepta el mínimo permitido (cantidad 1, precio de oferta 7999 < 8000)` |
| `CANTIDAD_INVALIDA` (decimal) | WB-06 | `WB-06: rechaza una cantidad decimal (1.5) con CANTIDAD_INVALIDA` |
| Orden de evaluación | (sin ID) | `evalúa la cantidad antes que el precio cuando ambos fallan` |
| `CANTIDAD_INVALIDA` (negativa) | (sin ID) | `rechaza una cantidad negativa (-1) con CANTIDAD_INVALIDA` |

### Qué camino NO está cubierto

Es la **limitación conocida del Bloque C**, declarada en el comentario del código (líneas 17–18) y en la matriz:

- **Precio de oferta negativo o cero**: `-100 >= 8000` es falso, así que la función responde «válido».
- **Precios no numéricos o `NaN`**: cualquier comparación con `NaN` es falsa, así que `precioOferta = NaN` también resulta «válido».
- **Precio original negativo o cero** con oferta menor (p. ej. original −5, oferta −10): también «válido».
- **Precios decimales**: se aceptan en la función (el formulario web sí exige enteros, `validar-formulario.ts`, líneas 32–38, pero la API no).

No hay pruebas de estos casos porque describirlos como «correctos» sería falso: hoy el sistema los **acepta**. Se reportan como hallazgo candidato, no se corrigieron (la tarea es solo de documentación y no se cambia la lógica de negocio). El controlador solo comprueba que los campos sean números (`CAMPOS_INVALIDOS`).

### Defecto que quedaría oculto si solo se probara el caso correcto

Con una oferta válida (cantidad 1, 7999 < 8000) pasarían inadvertidos:

- `>` en lugar de `>=` en la línea 28: permitiría un precio de oferta **igual** al original (un «descuento» de 0 %); solo lo detecta UNIT-05.
- Quitar `Number.isInteger`: permitiría 1.5 unidades (WB-06).
- Las limitaciones de la sección anterior: con solo casos correctos nadie vería que se puede publicar un precio negativo o `NaN`.
