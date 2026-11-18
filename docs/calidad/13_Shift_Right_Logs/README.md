# Shift-Right: análisis de logs de la API real

Cinco escenarios ejecutados el 18/11/2026 contra la **API local** (NestJS, base real en Supabase) para ver qué dejan los logs en operación. Es evidencia de «shift-right»: observar el sistema ejecutándose, no solo probarlo antes.

- Los logs son una línea JSON por petición (middleware global) más **eventos de negocio**, escritos en la salida estándar.
- Texto depurado: los UUID se sustituyeron por marcadores (`<usuario-consumidor1>`, `<oferta>`, `<reserva>`). No hay contraseñas, tokens, hashes ni rutas locales (se comprobó con una búsqueda automática).
- **No se ejecutó `npm run seed` ni `db:deploy`**: se usaron las cuentas y ofertas que ya existían.
- Script reproducible: [`ejecutar_escenarios.sh`](ejecutar_escenarios.sh). Log completo depurado: [`logs_escenarios_depurados.jsonl`](logs_escenarios_depurados.jsonl).

## Mapeo de campos: nuestros logs → los de la guía
| Guía | Nuestro campo | Observación |
|---|---|---|
| `timestamp` | `ts` | ISO 8601 en UTC. Equivalente directo. |
| `level` | `nivel` | `info` (< 400), `warn` (4xx), `error` (5xx). En eventos se fija a mano (p. ej. `LOGIN_FALLIDO` = `warn`). |
| `context` | `tipo` (solo en eventos: `"evento"`) y `metodo` + `ruta` (en líneas de petición) | **Parcial.** No hay un campo único: lo que identifica *dónde* ocurrió es la ruta como plantilla (`/reservas/:id/cancelar`) o el hecho de ser un evento. |
| `event` | `evento` (`LOGIN_OK`, `LOGIN_FALLIDO`, `RESERVA_CREADA`, `RESERVA_RECHAZADA`, `RESERVA_CANCELADA`, `RESERVA_ENTREGADA`, `ACCESO_DENEGADO`, `OFERTA_PUBLICADA`, `ERROR_INTERNO`, `SERVIDOR_INICIADO`) | Solo las líneas de evento lo tienen; las de petición se identifican por método + ruta + estado. |
| `message` | — | **Brecha.** No hay texto legible. Lo más cercano: `codigoError` o `motivo` (códigos del contrato) y, en `ERROR_INTERNO`, `error` + `detalle`. El `mensaje` que recibe el cliente no se registra. |
| `metadata` | El resto de claves del objeto: `usuarioId`, `rol`, `reservaId`, `ofertaId`, `cantidad`, `motivo`, `metodo`, `ruta`, `estado`, `duracionMs`, `codigoError` | Están planas, no anidadas bajo `metadata`. |

Brechas detectadas en la comparación (candidatas a hallazgos de la Etapa 9, sin cambiar código en este PR):
1. No hay `message` legible ni `context` explícito.
2. No hay identificador de correlación (`requestId`): el evento de negocio y la línea de petición que lo originó solo se pueden unir por proximidad de `ts` y `usuarioId`.
3. Los datos de entrada nunca se registran (decisión correcta de seguridad), pero tampoco se registra **qué campo** falló en un 400.

## (a) Flujo principal correcto: login + reserva
Comando (parte del script; el token no se imprime):
```bash
curl -s -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' \
  -d "{\"correo\":\"consumidor1@foodsave.test\",\"contrasena\":\"$SEED_PASSWORD\"}"
curl -s -X POST http://localhost:3001/reservas -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"ofertaId":"<oferta>","cantidad":1}'
```
Resultado: login 200, reserva 201. Después se canceló (200) para devolver la unidad al inventario.

> **Este escenario escribió en la base de datos real:** creó una reserva que quedó en estado **`CANCELADA`** (no se borra, queda como registro) y el stock de la oferta se **restituyó** a su valor anterior. Es el único escenario que escribe; los demás son de solo lectura o se rechazan antes de llegar a la base.

```json
{"ts":"2026-11-18T14:54:48.071Z","nivel":"info","tipo":"evento","evento":"LOGIN_OK","usuarioId":"<usuario-consumidor1>","rol":"CONSUMIDOR"}
{"ts":"2026-11-18T14:54:48.072Z","nivel":"info","metodo":"POST","ruta":"/auth/login","estado":200,"duracionMs":175}
{"ts":"2026-11-18T14:54:49.151Z","nivel":"info","tipo":"evento","evento":"RESERVA_CREADA","reservaId":"<reserva>","ofertaId":"<oferta>","usuarioId":"<usuario-consumidor1>","cantidad":1}
{"ts":"2026-11-18T14:54:49.152Z","nivel":"info","metodo":"POST","ruta":"/reservas","estado":201,"duracionMs":1073,"usuarioId":"<usuario-consumidor1>"}
{"ts":"2026-11-18T14:54:49.963Z","nivel":"info","tipo":"evento","evento":"RESERVA_CANCELADA","reservaId":"<reserva>","ofertaId":"<oferta>","usuarioId":"<usuario-consumidor1>","cantidad":1}
{"ts":"2026-11-18T14:54:49.964Z","nivel":"info","metodo":"POST","ruta":"/reservas/:id/cancelar","estado":200,"duracionMs":753,"usuarioId":"<usuario-consumidor1>"}
```
**Qué se aprende:**
- Cada operación deja **dos líneas**: el evento de negocio (qué pasó y con qué entidades) y la línea de petición (cómo respondió el servidor). El evento sale ~1 ms antes porque se escribe al terminar la operación y la petición al terminar la respuesta.
- La ruta se registra como plantilla (`/reservas/:id/cancelar`), así que las métricas se agrupan por endpoint y no por cada id.
- La línea de petición del login **no** lleva `usuarioId` (aún no hay sesión); el evento `LOGIN_OK` sí. Para seguir a una persona hay que cruzar ambas.
- Se puede reconstruir el flujo completo (login → reserva → cancelación) filtrando por `usuarioId`.

## (b) Credencial incorrecta
```bash
curl -s -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' \
  -d '{"correo":"consumidor1@foodsave.test","contrasena":"clave-incorrecta-log"}'
```
Resultado: `401 {"codigo":"CREDENCIALES_INVALIDAS","mensaje":"Credenciales inválidas"}`.
```json
{"ts":"2026-11-18T14:54:50.154Z","nivel":"warn","tipo":"evento","evento":"LOGIN_FALLIDO","motivo":"CREDENCIALES_INVALIDAS"}
{"ts":"2026-11-18T14:54:50.155Z","nivel":"warn","metodo":"POST","ruta":"/auth/login","estado":401,"duracionMs":173,"codigoError":"CREDENCIALES_INVALIDAS"}
```
**Qué se aprende:**
- Nivel `warn`: es un fallo esperado del usuario, no del sistema.
- El evento **no** guarda el correo, la contraseña ni si el correo existe: coincide con el diseño de AUTH-006 (misma respuesta para correo inexistente y clave errada) y evita filtrar datos en los logs.
- Contrapartida: para detectar fuerza bruta hay que contar `LOGIN_FALLIDO` por ventana de tiempo, pero no se puede saber contra *qué cuenta* ni desde *qué IP* (la IP tampoco se registra). Es una brecha para la Etapa 9 (el sistema no tiene límite de intentos).
- El tiempo (≈ 175 ms) es casi igual al del login correcto: no hay diferencia observable que delate si el correo existe.

## (c) Dato inválido
```bash
curl -s -X POST http://localhost:3001/reservas -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"ofertaId":"no-es-un-id","cantidad":"abc"}'
```
Resultado: `400 {"codigo":"CAMPOS_INVALIDOS","mensaje":"Los datos enviados no son válidos"}`.
```json
{"ts":"2026-11-18T14:54:50.162Z","nivel":"warn","metodo":"POST","ruta":"/reservas","estado":400,"duracionMs":0,"usuarioId":"<usuario-consumidor1>","codigoError":"CAMPOS_INVALIDOS"}
```
**Qué se aprende:**
- Solo hay línea de petición, **sin evento de negocio**: la validación del cuerpo falla antes de llegar a la regla de reserva, y `RESERVA_RECHAZADA` está reservado para los rechazos de negocio (`STOCK_INSUFICIENTE`, `OFERTA_NO_ACTIVA`…).
- `duracionMs: 0` confirma que se rechazó sin tocar la base de datos.
- El log dice *qué* falló (`CAMPOS_INVALIDOS`) pero no *qué campo*; no sirve para depurar un cliente mal configurado (brecha 3 del mapeo).
- Se registra el `usuarioId` aunque la petición sea inválida: permite atribuir el uso indebido.

## (d) Error controlado que genera `ERROR_INTERNO`
Opción elegida: **A**, una petición de **solo lectura** con un carácter nulo (`%00`) en la búsqueda. No se pasó a la opción B (instancia con base falsa) porque la A sí produjo el error.
```bash
curl -s -w '\nHTTP=%{http_code}\n' "http://localhost:3001/ofertas?q=%00"
```
Resultado: **`500 {"codigo":"ERROR_INTERNO","mensaje":"Error interno del servidor"}`**.
```json
{"ts":"2026-11-18T15:01:41.353Z","nivel":"error","tipo":"evento","evento":"ERROR_INTERNO","error":"PrismaClientKnownRequestError","detalle":"\nInvalid `this.prisma.oferta.findMany()` invocation in\n<repo>/apps/api/dist/ofertas/ofertas.service.js:73:35\n\n  70 }\n  71 listarActivas(q) {\n  72     const texto = q?.trim();\n→ 73     return this.prisma.oferta.findMany(\nDatabase error. Code: `22021`. Message: `invalid byte sequence for encoding \"UTF8\": 0x00`"}
{"ts":"2026-11-18T15:01:41.356Z","nivel":"error","metodo":"GET","ruta":"/ofertas","estado":500,"duracionMs":695,"codigoError":"ERROR_INTERNO"}
```
(El extracto completo y depurado está en [`logs_escenario_d_depurado.jsonl`](logs_escenario_d_depurado.jsonl); la segunda línea real no lleva el campo `tipo`.)

### Hallazgo real: una entrada de usuario provoca un 500
PostgreSQL no admite el byte `0x00` en texto; el parámetro `q` llega a Prisma sin validarse y la base lanza el error `22021`, que el filtro de excepciones convierte en `ERROR_INTERNO`. **Es un defecto del sistema, no se corrigió** (regla de esta tanda: no tocar código). Cualquier persona sin sesión puede provocarlo con una URL, porque `GET /ofertas` es público. Efectos: un 500 donde correspondía un 400 `CAMPOS_INVALIDOS` (o tratar el texto como búsqueda sin resultados) y ruido de nivel `error` en los logs que activaría alertas falsas. Candidato a hallazgo de la Etapa 9, de severidad baja (no expone datos ni cambia estado).

### Comprobaciones de seguridad sobre el log y la respuesta
| Comprobación | Resultado |
|---|---|
| ¿La **respuesta al cliente** revela el detalle? | **No.** Solo `{"codigo":"ERROR_INTERNO","mensaje":"Error interno del servidor"}`. |
| ¿El `detalle` del log incluye cadena de conexión, usuario, host o contraseña de la base? | **No** (búsqueda automática de `postgres`, `supabase`, `pooler`, `@`, usuario y host de `DATABASE_URL`, contraseña de las semillas y tokens). |
| ¿El `detalle` incluye rutas locales? | **Sí.** La ruta absoluta del archivo compilado, con el nombre de usuario del equipo. **Se redactó** en el extracto (`<repo>/…`). |
| ¿Incluye código fuente? | **Sí.** Cuatro líneas del servicio alrededor del fallo (el mensaje de Prisma las adjunta). No es un secreto, pero revela la estructura interna. |

**Brecha registrada:** el evento `ERROR_INTERNO` vuelca `exception.message` completo en `detalle`. Con Prisma ese texto trae la ruta absoluta del servidor y un fragmento del código. No es un problema en el cliente (nunca sale), pero **sí lo es si los logs se envían a un servicio externo o los leen más personas**. Mejora para la Etapa 9: registrar solo `error` y el código de base de datos (`22021`), o recortar la primera línea, y añadir un `requestId`.

**Qué se aprende:**
- El mecanismo funciona como se diseñó: el error inesperado se **captura**, se responde con un mensaje genérico, se registra con `nivel: error` y, en la línea de petición, `codigoError: ERROR_INTERNO` con estado 500.
- Son **dos líneas** y la de evento (que explica la causa) no lleva ni ruta ni usuario: para saber qué petición lo causó hay que cruzarla por `ts` con la siguiente. Sin `requestId` esa correlación falla cuando hay tráfico concurrente (brecha 2 del mapeo).
- Una alerta útil sería «cualquier línea con `nivel: error`»: aquí habría saltado por una entrada hostil sin consecuencias, lo que ilustra la importancia de validar entradas antes de llegar a la base.

## (e) Una operación con su duración (`duracionMs`)
Se usó la reserva del escenario (a) y se comparó con cinco consultas de solo lectura al listado (`GET /ofertas?q=E2E`):

| Operación | `duracionMs` |
|---|---|
| `GET /ofertas` (1.ª, en frío) | 563 |
| `GET /ofertas` (2.ª a 6.ª) | 187, 186, 187, 188, 188 |
| `POST /auth/login` (verifica hash bcrypt) | 175 |
| `POST /reservas` (transacción con varias consultas) | 1073 |
| `POST /reservas/:id/cancelar` (transacción) | 753 |
| `POST /reservas` con cuerpo inválido (sin base de datos) | 0 |

**Qué se aprende:**
- Una consulta simple cuesta ~187 ms de manera muy estable: es sobre todo el **viaje de ida y vuelta a la base de datos** (Supabase remoto), no el cómputo.
- La reserva tarda ~1,1 s y la cancelación ~0,75 s porque cada una ejecuta varias consultas dentro de una transacción; el coste crece con el número de viajes a la base. Es el dato útil para fijar un objetivo de latencia y detectar regresiones.
- La primera petición tras arrancar es más lenta (563 ms: conexión en frío); una alerta de latencia debe ignorar o tratar aparte los primeros segundos.
- El login pese a hacer bcrypt tarda lo mismo que una consulta simple: el coste del hash es pequeño frente a la red.
- La medición del cliente (`curl`, ≈ 188 ms) coincide con la del servidor (`duracionMs`, 186-188 ms): la sobrecarga de red local es despreciable, así que `duracionMs` es fiable.
