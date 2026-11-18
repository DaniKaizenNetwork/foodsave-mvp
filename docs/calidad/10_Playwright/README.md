# Pruebas end-to-end con Playwright (E2E-01 a E2E-05)

Cinco casos de `docs/calidad/04_Matriz_Pruebas.xlsx` ejecutados en un navegador real (Google Chrome instalado) contra la web y la API locales. Los localizadores siguen `docs/calidad/correspondencia_matriz_codigo.md` §5; no se añadió ningún `data-testid`.

| ID | Archivo (`e2e/tests/`) | Flujo | SWR |
|---|---|---|---|
| E2E-01 | `flujo-principal.spec.ts` | Dueño publica → consumidor busca y reserva 2 → personal marca «Entregada» (3 sesiones) | AUTH-005, OFE-001, BUS-001, RES-001/003/005, RES-015 |
| E2E-02 | `flujo-cancelacion.spec.ts` | Consumidor reserva 2 y cancela; el inventario vuelve a 5 | RES-001, RES-011 |
| E2E-03 | `registro.spec.ts` | Registro y primer inicio de sesión | AUTH-001, AUTH-005, SEC-002 |
| E2E-04 | `seguridad.spec.ts` | Clave errada y ruta protegida sin sesión | AUTH-006, AUTH-010 |
| E2E-05 | `oferta-validacion.spec.ts` | Precio de oferta = original se rechaza; corregido, se publica | OFE-003, OFE-001 |

E2E-01 y E2E-02 están comentados en español paso a paso. Cada caso crea sus propios datos (`E2E <Date.now()>`), así que **no requieren `npm run seed`** ni reiniciar la base.

## Requisitos
- Cuentas `@foodsave.test` ya sembradas en la base (`npm run seed:test` o `npm run seed`).
- `.env` en la raíz con `SEED_PASSWORD`, `PORT`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL` (la configuración lo carga sin imprimirlo).
- Google Chrome instalado (la configuración usa `channel: 'chrome'`; no se descargan navegadores de Playwright).

## Cómo ejecutarlas
```bash
npm install
npm test -w e2e        # levanta la API (build + start:prod) y la web (next dev --webpack) si no están activas
npx playwright show-report docs/calidad/10_Playwright/reporte-html
```
Si la API o la web ya están corriendo en 3001 y 3000, se reutilizan.

## Evidencia de la ejecución real
18/11/2026: **5 pruebas, 5 aprobadas, 0 fallidas** (≈41 s, 1 worker, Chrome).

| Archivo | Contenido |
|---|---|
| `resultado_playwright_consola.txt` | Salida de consola |
| `reporte-html/` | Reporte HTML; cada prueba trae su **trace** (pestaña «Traces» / «Trace» del reporte) con acciones, capturas y red |

## Seguridad de la evidencia
Un trace guarda lo que se teclea y las peticiones de red, o sea la contraseña de las cuentas sembradas y los JWT. Antes de versionar, `e2e/scripts/sanear_reporte.py` redactó (`[REDACTADO]`, `[JWT-REDACTADO]`) el reporte y los zips de los traces (incluido el zip incrustado en `index.html`) y verificó que no quedara nada. Se comprobó que los traces originales sí contenían secretos (hasta 27 apariciones de la contraseña), de modo que la verificación no es vacía. **Repite el saneado antes de versionar cualquier reporte nuevo:**
```bash
node --env-file=.env -e "const r=require('node:child_process').spawnSync('python3',['-I','e2e/scripts/sanear_reporte.py','docs/calidad/10_Playwright/reporte-html'],{stdio:'inherit'}); process.exit(r.status)"
```
