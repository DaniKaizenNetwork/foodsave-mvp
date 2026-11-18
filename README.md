<p align="center">
  <img src="docs/marca/logo/foodsave-logo-horizontal.png" alt="FoodSave" width="260">
</p>

# FoodSave

Plataforma web para que comercios de Neiva publiquen **productos próximos a vencer con descuento**, y para que los consumidores los **reserven** y los **paguen y recojan en la sede**. Reduce el desperdicio de alimentos y le da una salida a lo que de otro modo se perdería.

Proyecto final de **Calidad de Software** · Ingeniería de Sistemas · Corporación Universitaria del Huila (CORHUILA) · Docente: Cesar Augusto Pérez Tafur · Noviembre de 2026.

## Equipo

| Integrante |
|---|
| Sebastián Puentes González |
| Daniela Sanabria Mosquera |
| Danay Mariana Pereira Ospina |

## Qué hace el MVP

Se implementaron 15 requisitos de software (SWR) del SRS, con trazabilidad hasta los requisitos de sistema, de stakeholder y de negocio (ISO/IEC/IEEE 29148).

| Módulo | Qué permite | SWR |
|---|---|---|
| Usuarios y autenticación | Registro, inicio de sesión, rutas protegidas por rol, contraseñas con hash | AUTH-001, 005, 006, 010 · SEC-002 |
| Ofertas e inventario | El dueño publica una oferta con precio menor al original y cantidad válida | OFE-001, 003 |
| Consulta de ofertas | Listado público de ofertas activas y búsqueda por nombre | BUS-001, 005 |
| Reservas | Reservar sin sobreventa, plazo de retiro, cancelar y marcar entregada | RES-001, 002, 003, 005, 011, 015 |

**Flujo principal:** el consumidor inicia sesión, busca una oferta, la reserva (se descuenta el inventario) y la recoge en la sede dentro del plazo. Si cancela, el inventario se devuelve.

Fuera del alcance del MVP: pagos en línea, notificaciones y reportes administrativos.

## Tecnologías

- **Monorepo** con npm workspaces: `apps/api`, `apps/web` y `e2e`.
- **API:** NestJS 11, TypeScript 5.9, Prisma 7, PostgreSQL (Supabase) con Row Level Security, autenticación JWT propia, logs JSON por petición.
- **Web:** Next.js 16, React 19, Tailwind 4, sobre la plantilla *Next.js Shadcn Dashboard Starter*, con la identidad visual de FoodSave.
- **Pruebas:** Jest, Vitest con React Testing Library, Postman/newman, Playwright.
- **Integración continua:** GitHub Actions, flujo **CI / Quality Gate**.

## Cómo está organizado el repositorio

```
apps/api/        API NestJS (reglas de dominio, autenticación, ofertas, reservas)
apps/web/        Aplicación Next.js
e2e/             Pruebas de extremo a extremo con Playwright
docs/srs/        Alcance, SWR seleccionados y trazabilidad
docs/calidad/    Dossier de calidad y pruebas (01 a 14)
docs/trazabilidad/  Matriz maestra BR → STK → SYS → SWR → prueba
docs/informe/    Informe final (PDF)
```

## Cómo ejecutarlo en local

Requisitos: Node.js 22 y acceso a una base PostgreSQL. Los secretos van en el archivo `.env`, que **no se sube al repositorio**.

```bash
npm install
npm run db:deploy      # aplica las migraciones
npm run seed           # datos de demostración (requiere SEED_ALLOW_RESET=true; borra datos de prueba)
npm run dev:api        # API en http://localhost:3001
npm run dev -w apps/web   # web en http://localhost:3000
```

La contraseña de las cuentas de demostración se define en la variable `SEED_PASSWORD` y no está escrita en el repositorio.

## Pruebas y calidad

```bash
npm run lint                  # ESLint (0 errores, 19 advertencias conocidas)
npm run typecheck             # chequeo de tipos
npm test                      # pruebas de la API (Jest) y de la web (Vitest)
npm run test:cov -w apps/api  # cobertura, con umbral del 90 % en las funciones de dominio
```

| Tipo | Resultado |
|---|---|
| Matriz de pruebas | 58 casos, 58 aprobados |
| Unitarias y caja blanca (Jest) | 114 de 114 |
| Componentes (Vitest + RTL) | 12 de 12 |
| API (Postman/newman) | 17 solicitudes, 42 aserciones, 0 fallos |
| E2E (Playwright) | 5 de 5 |
| Shift Right | 5 escenarios con logs depurados |

Cada PR hacia `develop` o `main` pasa por **CI / Quality Gate**: lint, chequeo de tipos, pruebas y cobertura.

## Documentación

- [Informe final](docs/informe/Informe_Final_FoodSave.pdf)
- [Dossier de calidad](docs/calidad/)
- [Matriz maestra de trazabilidad](docs/trazabilidad/Matriz_Maestra_Trazabilidad.xlsx)
- [Ficha de marca](docs/marca/)

## Flujo de trabajo en Git

`main` está protegida. Se trabaja en ramas (`feature/…`, `docs/…`, `test/…`, `chore/…`) y se integra por Pull Request a `develop`, con commits `tipo(módulo): descripción`. El historial completo está en [`docs/historial_commits.txt`](docs/historial_commits.txt).

## Decisión de liberación

Se recomienda **liberar el MVP con condiciones, como piloto controlado en una sede de Neiva**. El detalle de los hallazgos abiertos y las condiciones está en el informe final.
