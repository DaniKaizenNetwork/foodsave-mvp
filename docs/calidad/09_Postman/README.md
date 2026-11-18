# Pruebas de API con Postman / newman (API-01 a API-08)

Colección que automatiza los casos **API-01 a API-08** de `docs/calidad/04_Matriz_Pruebas.xlsx`.
Cada petición valida el **estado HTTP**, el **código de error** (y su mensaje exacto) y la **regla de negocio** del caso.

| Caso | Petición | Regla de negocio validada | SWR |
|---|---|---|---|
| API-01 | `POST /auth/login` (consumidor1) | 200, `accessToken`, `usuario.rol = CONSUMIDOR`, sin contraseña ni hash | AUTH-005 |
| API-02 | `POST /auth/login` clave incorrecta | 401 `CREDENCIALES_INVALIDAS`, sin token; respuesta idéntica a la de correo inexistente | AUTH-006 |
| API-03 | `POST /ofertas` con token CONSUMIDOR | 403 `PROHIBIDO`; la oferta no se crea | AUTH-010 |
| API-04 | `POST /ofertas` con token DUENO | 201 `ACTIVA`, `disponible = cantidad = 10`, precio de oferta < original | OFE-001 |
| API-05 | `POST /ofertas` precios iguales (8000/8000) | 400 `PRECIO_INVALIDO`; la oferta no se crea | OFE-003 |
| API-06 | `POST /reservas` cantidad 2 | 201 `RESERVADA`, `plazoRetiro` ≤ creación + 12 h y ≤ vencimiento; inventario 10 → 8 | RES-001, 002, 003, 005 |
| API-07 | `POST /reservas` cantidad 999 | 409 `STOCK_INSUFICIENTE`; inventario sigue en 8 | RES-002 |
| API-08 | `POST /reservas/:id/cancelar` | 200 `CANCELADA`; inventario vuelve a 10 | RES-011 |

La carpeta **00 Preparación** (logins de apoyo y `GET /sedes/mias`) guarda los tokens y el `sedeId` en el environment; no es un caso de la matriz.

## Requisitos
- API local en marcha (por defecto `http://localhost:3001`) conectada a una base con las cuentas `@foodsave.test` (`npm run seed` o `npm run seed:test`).
- Node.js. **No se instala nada en el repositorio**: newman se descarga y ejecuta con `npx` (no toca `package.json` ni `package-lock.json`).
- La contraseña de las cuentas (`SEED_PASSWORD`) **nunca** se guarda en el repo: la variable `password` del environment va vacía.

## Ejecución
Desde la raíz del repositorio, con la API levantada (`npm run dev:api`):

```bash
# La contraseña viene de tu entorno; no la escribas en ningún archivo versionado.
npx --yes newman run docs/calidad/09_Postman/FoodSave.postman_collection.json \
  -e docs/calidad/09_Postman/FoodSave.local.postman_environment.json \
  --env-var "password=$SEED_PASSWORD"
```

Para generar también los reportes: añade `--reporters cli,junit,json --reporter-junit-export reporte.xml --reporter-json-export reporte.json`.
**Antes de versionar un reporte JSON**, redáctalo: contiene la contraseña enviada en el login, los JWT y las cabeceras `Authorization`.

Los casos se ejecutan en orden (cada carpeta usa variables guardadas por las anteriores) y crean datos con nombres únicos (`Date.now()`), así que se pueden repetir sin reiniciar la base. Para apuntar a otra API cambia `baseUrl` con `--env-var "baseUrl=https://..."`.

## Evidencia de la ejecución real
Ejecución contra la API local (18/11/2026, newman con `npx --yes newman`): **17 peticiones, 42 assertions, 0 fallidas**.

| Archivo | Contenido |
|---|---|
| `reporte_newman_consola.txt` | Salida de consola de newman |
| `reporte_newman.xml` | Reporte JUnit |
| `reporte_newman.json` | Reporte JSON completo |

Los tres están **redactados**: la contraseña, los JWT y los valores de `Authorization` se reemplazaron por `[REDACTADO]` / `[JWT-REDACTADO]`, y se verificó con una búsqueda que no queda ningún secreto.
