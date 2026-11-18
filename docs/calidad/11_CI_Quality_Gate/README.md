# Integración continua y Quality Gate

Workflow: [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). Se ejecuta en cada **pull request hacia `develop` o `main`** (Node 22, `ubuntu-latest`, caché de npm).

## Pasos y Quality Gate
El workflow es un único trabajo («Quality Gate») con pasos en serie. **Si cualquiera falla, el workflow falla y el PR no debe fusionarse.**

| # | Paso | Comando | Falla si… |
|---|---|---|---|
| 1 | Instalar | `npm ci` | el `package-lock.json` no coincide con los `package.json` |
| 2 | Lint | `npm run lint` | hay **errores** de ESLint (los *warnings* no bloquean) |
| 3 | Typecheck | `npm run typecheck` | `tsc` falla en `apps/api` o `apps/web` |
| 4 | Pruebas de la API | `npm run test:cov -w apps/api` | falla una prueba Jest **o** alguna función de dominio queda bajo el umbral de cobertura |
| 5 | Pruebas de la web | `npm test -w apps/web` | falla una prueba Vitest/RTL |
| 6 | Build | `npm run build` | no compila `apps/api` (Nest) o `apps/web` (Next) |

### Umbral de cobertura
`apps/api/jest.config.js` exige **≥ 90 %** de sentencias, ramas, funciones y líneas en cada función de dominio: `plazo-retiro`, `cierre-sede`, `verificar-reserva`, `verificar-cancelacion`, `validar-oferta`, `password` y `roles.guard`. Hoy están al 100 %. No hay umbral global a propósito: controladores, módulos de Nest, código generado por Prisma y semillas (cobertura global ≈ 55 %) los verifican Postman y Playwright, no las unitarias.

## ESLint
`eslint.config.mjs` (ESLint 10.14.0, typescript-eslint 8.72.1, compatible con TypeScript 5.9.3 y sin reglas que requieran información de tipos). Cubre `apps/api/src` y `apps/web/src`. **No se reescribió código.**

Resultado actual: **0 errores, 19 *warnings***. Esas reglas ya estaban incumplidas, así que se dejaron en `warn` (deuda técnica a corregir en la Etapa 10); cualquier otra regla `recommended` sigue siendo `error`.

| Regla (en `warn`) | Cantidad | Dónde |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | 9 | `reservas-cierre.service.spec.ts` (7), `reservas.service.spec.ts` (2): *mocks* de Prisma en pruebas |
| `@typescript-eslint/no-unused-vars` | 4 | `lib/data-table-features.ts` (parámetros de tipo de la plantilla) |
| `@next/next/no-img-element` | 5 | `auth-shell.tsx` (3), `app-sidebar.tsx` (2): logos con `<img>` |
| `@typescript-eslint/no-empty-object-type` | 1 | `lib/data-table-types.ts` |

Se añadió `@next/eslint-plugin-next` solo porque el código de la plantilla ya cita `no-img-element` en comentarios `eslint-disable`, y sin el plugin ESLint daba error por regla desconocida.

## Verificación de la puerta
Se reprodujo cada paso en un clon limpio, sin `.env` y con variables ficticias: los seis pasos pasan (114 pruebas Jest, 12 Vitest, build de api y web). Se comprobó que la puerta **sí bloquea**: un `debugger;` hace que `npm run lint` salga con código 1, y un umbral imposible (101 %) hace fallar Jest con «does not meet threshold».

## Limitaciones
- **Postman (API-01…08) y Playwright (E2E-01…05) NO están en el CI.** Necesitan una base de datos PostgreSQL con las cuentas sembradas y secretos (`SEED_PASSWORD`, `DATABASE_URL`, `JWT_SECRET`). El CI usa valores ficticios y ninguna prueba toca la base ni la red. Esas suites se ejecutan a mano (ver `09_Postman/README.md` y `10_Playwright/README.md`). Incorporarlas exigiría una base de pruebas efímera y secretos del repositorio en GitHub.
- El workflow solo se ejecuta en GitHub; aquí se validó reproduciendo sus comandos localmente y comprobando la sintaxis YAML, no con una ejecución real en Actions.
- Las cuentas `@foodsave.test`, los casos de caja negra y la revisión manual no forman parte de la puerta.
