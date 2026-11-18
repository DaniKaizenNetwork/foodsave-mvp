# Pruebas de componentes con React Testing Library (RTL-01 a RTL-12)

Pruebas de los 6 componentes web definidos en `docs/calidad/04_Matriz_Pruebas.xlsx`, escritas con Vitest + React Testing Library + `user-event` (sin dependencias nuevas). La API se simula con `vi.mock`; no se necesita servidor ni base de datos.

| ID | Archivo (`apps/web/src/components/`) | Qué comprueba | SWR |
|---|---|---|---|
| RTL-01 | `RegisterForm.test.tsx` | Envío vacío: tres mensajes de campo obligatorio y no se llama a la API | SWR-AUTH-001 |
| RTL-02 | `RegisterForm.test.tsx` | Datos válidos: llamada con nombre recortado y «Cuenta creada correctamente» | SWR-AUTH-001 |
| RTL-03 | `LoginForm.test.tsx` | Credenciales válidas: sesión guardada y navegación a `/ofertas` | SWR-AUTH-005 |
| RTL-04 ★ | `LoginForm.test.tsx` | Credenciales inválidas: «Credenciales inválidas» (`role="alert"`), sin navegar ni guardar sesión | SWR-AUTH-006 |
| RTL-05 | `RutaProtegida.test.tsx` | CONSUMIDOR en ruta de DUENO/PERSONAL: «No tienes permiso para realizar esta acción», sin contenido | SWR-AUTH-010 |
| RTL-06 | `ListaOfertas.test.tsx` | Estado de carga «Cargando ofertas…» | SWR-BUS-001 |
| RTL-07 | `ListaOfertas.test.tsx` | Sin ofertas: «No hay ofertas disponibles» | SWR-BUS-001 |
| RTL-08 | `ListaOfertas.test.tsx` | Dos ofertas con producto, precio y unidades disponibles | SWR-BUS-001 |
| RTL-09 | `ListaOfertas.test.tsx` | Buscar «pan» consulta la API con `q=pan` y actualiza la URL | SWR-BUS-005 |
| RTL-10 ★ | `OfertaForm.test.tsx` | Precio de oferta = original: error de precio y no se envía | SWR-OFE-003 |
| RTL-11 | `ReservaForm.test.tsx` | 409 `STOCK_INSUFICIENTE`: «No hay unidades suficientes», sin confirmación | SWR-RES-002 |
| RTL-12 ★ | `ReservaForm.test.tsx` | Botón deshabilitado al enviar; luego «Reserva confirmada» con plazo y botón habilitado | SWR-RES-001, SWR-RES-005 |

★ Candidatas a explicar en la sustentación: están comentadas en español, línea por línea (Arrange → Act → Assert).

El auxiliar compartido es `apps/web/src/test/render.tsx` (`renderConProveedores`: `QueryClientProvider` + `AuthProvider` + sesión opcional en `localStorage`, y la oferta de prueba). Cada prueba declara sus propios `vi.mock`.

## Cómo ejecutarlas
```bash
npm test -w apps/web
```

## Resultado de la ejecución real
18/11/2026: **6 archivos, 12 pruebas, 12 aprobadas, 0 fallidas** (≈2,6 s).

- `resultado_rtl.txt`: salida detallada de Vitest.
- `resultado_rtl.xml`: reporte JUnit.
