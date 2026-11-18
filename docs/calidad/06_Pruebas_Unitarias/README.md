# Pruebas unitarias (UNIT-01 a UNIT-16)

Pruebas Jest de la lógica de negocio de `apps/api`. Cada regla vive en una función pura (el reloj entra como `ahora`) y su prueba nació con ella (Arrange → Act → Assert). IDs y casos: hojas «Unitarias» y «Caja blanca» de `docs/calidad/04_Matriz_Pruebas.xlsx`.

| ID | Función / unidad | Archivo (`apps/api/src/…`) | Nombre de la prueba | SWR |
|---|---|---|---|---|
| UNIT-01 | `calcularPlazoRetiro` | `reservas/plazo-retiro.spec.ts` | UNIT-01 / TC-RES-002: limita las 12 horas (07:00, cierre 20:00, vence 23:00 → 19:00) | RES-005 |
| UNIT-02 | `calcularPlazoRetiro` | `reservas/plazo-retiro.spec.ts` | UNIT-02 / TC-RES-001: limita el cierre de la sede (17:00, cierre 20:00, vence 23:00 → 20:00) | RES-005 |
| UNIT-03 | `calcularPlazoRetiro` | `reservas/plazo-retiro.spec.ts` | UNIT-03 / TC-RES-003: limita el vencimiento tras el cierre (10:00, cierre 21:00, vence 15:00 → 15:00) | RES-005 |
| UNIT-04 | `validarOferta` | `ofertas/validar-oferta.spec.ts` | UNIT-04: rechaza cantidad cero con CANTIDAD_INVALIDA | OFE-003 |
| UNIT-05 | `validarOferta` | `ofertas/validar-oferta.spec.ts` | UNIT-05: rechaza un precio de oferta igual al original con PRECIO_INVALIDO | OFE-003 |
| UNIT-06 | `validarOferta` | `ofertas/validar-oferta.spec.ts` | UNIT-06: acepta el mínimo permitido (cantidad 1, precio de oferta 7999 < 8000) | OFE-003 |
| UNIT-07 | `verificarReserva` | `reservas/verificar-reserva.spec.ts` | UNIT-07: una cantidad mayor al stock se rechaza con STOCK_INSUFICIENTE | RES-002 |
| UNIT-08 | `hashPassword` / `verifyPassword` | `auth/password.spec.ts` | guarda la contraseña con hash y sal, y verifyPassword distingue la clave correcta (describe «UNIT-08») | SEC-002 |
| UNIT-09 | `verificarCancelacion` | `reservas/verificar-cancelacion.spec.ts` | UNIT-09: permite cancelar una reserva RESERVADA con el plazo vigente (ahora 18:00, plazo 20:00) | RES-011 |
| UNIT-10 | `verificarCancelacion` | `reservas/verificar-cancelacion.spec.ts` | UNIT-10: rechaza con el plazo vencido, incluida la frontera (ahora = plazo y ahora > plazo) | RES-011 |
| UNIT-11 | `verificarCancelacion` | `reservas/verificar-cancelacion.spec.ts` | UNIT-11: rechaza si la reserva no está RESERVADA (ENTREGADA o CANCELADA) aunque el plazo esté vigente | RES-011 |
| UNIT-12 | `calcularCierreSede` | `reservas/cierre-sede.spec.ts` | UNIT-12: el cierre de una sede 24 h es null | RES-005 |
| UNIT-13 | `calcularCierreSede` | `reservas/cierre-sede.spec.ts` | UNIT-13: el cierre de una sede con horario es el del día de la reserva en hora de Bogotá | RES-005 |
| UNIT-14 | `AuthService.login` | `auth/auth.service.spec.ts` | responde igual con correo inexistente que con contraseña errada (describe «UNIT-14») | AUTH-006 |
| UNIT-15 | `RolesGuard` | `auth/roles.guard.spec.ts` | permite al DUENO / deniega al CONSUMIDOR con PROHIBIDO / exige sesión… (describe «UNIT-15», 4 pruebas) | AUTH-010 |
| UNIT-16 | `redact` (logs) | `common/logging/redact.spec.ts` | oculta contraseñas, hash, tokens y Authorization y conserva el resto (describe «UNIT-16», 3 pruebas) | regla de CLAUDE.md (sin SWR propio; la spec la rotula SEC-002) |

Las pruebas de caja blanca **WB-01 a WB-07** (`plazo-retiro`, `verificar-reserva`, `validar-oferta`) están en los mismos archivos y también se ejecutan. En total hay 114 pruebas porque el resto son pruebas de servicios, DTO, middleware de logs y guarda de semillas, escritas junto a su código.

## Cómo ejecutarlas
```bash
npm install
cd apps/api
npx jest --coverage
```

## Resultado de la ejecución real
18/11/2026: **16 suites, 114 pruebas, 114 aprobadas, 0 fallidas** (≈4 s). Salida completa en `resultado_jest_cobertura.txt` (sin secretos ni rutas locales: la tabla usa rutas relativas).

### Cómo leer la cobertura
La cobertura global es 55,3 % de sentencias (47,3 % de funciones). **No es la cifra relevante**: incluye controladores, módulos de Nest, el código generado por Prisma y el script de semillas, que las pruebas unitarias no pretenden cubrir (se verifican con Postman, E2E y los humos manuales). Las **funciones de dominio**, que son el objeto de las unitarias, están al 100 % de sentencias, ramas y funciones:

| Función de dominio | Sentencias | Ramas | Funciones |
|---|---|---|---|
| `reservas/plazo-retiro.ts` | 100 | 100 | 100 |
| `reservas/cierre-sede.ts` | 100 | 100 | 100 |
| `reservas/verificar-reserva.ts` | 100 | 100 | 100 |
| `reservas/verificar-cancelacion.ts` | 100 | 100 | 100 |
| `ofertas/validar-oferta.ts` | 100 | 100 | 100 |
| `auth/password.ts` | 100 | 100 | 100 |
| `auth/roles.guard.ts` | 100 | 100 | 100 |
| `common/errores.ts` | 100 | 100 | 100 |

Sin cubrir a propósito: `reservas.controller.ts`, `ofertas.controller.ts`, `auth.controller.ts`, `jwt.guard.ts`, `http-exception.filter.ts`, `sedes.service.ts`, `prisma.service.ts` y `seed.ts` (0 % o parcial en la tabla); su comportamiento lo cubren las pruebas de integración de las demás carpetas de `docs/calidad/`.
