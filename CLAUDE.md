# FoodSave · instrucciones para Claude Code

Proyecto final de Calidad de Software (CORHUILA, Ingeniería de Sistemas). FoodSave es una plataforma web para publicar productos próximos a vencer con descuento y reservarlos; el pago y la recogida se hacen en la sede (Neiva). Lo que se construye es un **MVP**, y la calidad y la trazabilidad importan tanto como el código.

## Alcance (no negociable)
- Solo se implementan los **15 SWR** de `docs/srs/SWR_seleccionados.md`. **No implementes nada fuera de ese alcance**, ni "por si acaso". Si algo parece necesario y no está, detente y pregunta.
- Módulos: Usuarios y autenticación (base), Ofertas e inventario, Consulta de ofertas, Reservas.
- Flujo principal: autenticarse → dueño o personal publica una oferta → consumidor busca y reserva → personal marca «Entregada». Alterno: el consumidor cancela.
- Comercio, sedes, horarios, categorías y cuentas de prueba se **precargan con semillas**; no hay pantallas para administrarlos.
- Contrato de rutas, endpoints, funciones, entidades y mensajes: hoja «Contrato provisional» de `docs/calidad/04_Matriz_Pruebas.xlsx`. Mensajes exactos: hoja «Datos y mensajes». **Respeta esos nombres al pie de la letra**: las pruebas ya diseñadas dependen de ellos. Si debes desviarte, dilo en la descripción del PR.

## Stack y estructura
- Monorepo con npm workspaces: `apps/web` (Next.js + React + TypeScript, plantilla Kiranism/next-shadcn-dashboard-starter adaptada), `apps/api` (NestJS + Prisma), `e2e/` (Playwright).
- Base de datos: PostgreSQL (Supabase) con Prisma. El frontend **nunca** accede a la base de datos; solo llama a la API REST.
- Pruebas: Jest en `apps/api`; Vitest + React Testing Library en `apps/web`.
- Identidad visual: `docs/marca/` (logo en `docs/marca/logo/`, colores y fuentes en `docs/marca/brand-tokens.css`). Primario `#14683B`, secundario `#F7B21A`, acento `#F26B21`; Fredoka (títulos) y Nunito (cuerpo). Mantén la estructura de la plantilla (sidebar, cards, tablas, formularios).
- No uses el proveedor de autenticación ni los servicios externos de la plantilla.

## Reglas de diseño del código
- La lógica de negocio va en **funciones puras** dentro de `apps/api/src/<modulo>/` (`calcularPlazoRetiro`, `verificarReserva`, `validarOferta`, `hashPassword`/`verifyPassword`). El reloj se recibe como parámetro (`ahora`); no llames a `new Date()` dentro de esas funciones.
- Controladores delgados: validan la entrada, llaman al dominio y a Prisma, y devuelven `{ codigo, mensaje }` en los errores.
- La reserva se hace en una transacción de Prisma: verificar, descontar el inventario y crear la reserva de forma atómica.
- Contraseñas con `bcryptjs` (hash con sal); nunca en texto plano ni en los logs.
- Autorización en el servidor con guard de JWT y guard de roles (CONSUMIDOR, PERSONAL, DUENO); el personal y el dueño solo operan sobre su sede.
- **Logs desde el primer endpoint**: un interceptor global escribe una línea JSON por petición (marca de tiempo, nivel, método, ruta, estado, duración en ms, usuario si existe, código de error). Registra además los eventos de negocio (login fallido, reserva rechazada con su motivo, reserva creada, cancelada, entregada). Nunca registres contraseñas, tokens ni el hash.
- Variables de entorno en `.env` (fuera de Git) y `.env.example` versionado sin valores reales: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `SEED_PASSWORD`, `SEED_ALLOW_RESET`, `CORS_ORIGIN`, `PORT`, `NEXT_PUBLIC_API_URL`.
- Semillas: `npm run seed` (demo, con ofertas) y `npm run seed:test` (sin ofertas) reinician los datos y **solo se ejecutan si `.env` tiene `SEED_ALLOW_RESET=true`**. Cuentas `@foodsave.test` según la hoja «Datos y mensajes». Sede Centro es 24 h (`abierta24h`, cierre nulo); Sede Norte cierra a las 20:00.
- Códigos de error y mensajes: los de las hojas «Contrato provisional» y «Datos y mensajes» (versión 2 de la matriz), centralizados en `apps/api/src/common/errores.ts`.

## Pruebas
- Cada regla de negocio **nace con su prueba unitaria** (patrón Arrange → Act → Assert). No inventes funciones artificiales para cumplir un número de pruebas.
- Los casos están diseñados en `docs/calidad/04_Matriz_Pruebas.xlsx` (IDs UNIT-xx, WB-xx, RTL-xx). Mantén los nombres de componentes y funciones de esa matriz. Los archivos de prueba de cada tipo se escriben en la Etapa 8, salvo las unitarias, que acompañan a la regla.
- No ejecutes ni modifiques las pruebas para que "pasen": si una falla, repórtalo.

## Git
- Nunca hagas commit en `main` ni en `develop`. Una rama por unidad de trabajo (`feature/...`, `test/...`, `fix/...`) y PR hacia `develop`.
- Commits pequeños con el formato `tipo(módulo): descripción` (feat, fix, test, docs, chore, refactor).
- No subas secretos, `.env`, `node_modules` ni archivos generados.

## Cómo trabajar en este proyecto
- Primero presenta el plan y **espera aprobación** antes de escribir código.
- Explica brevemente cada decisión relevante; el equipo debe poder justificarla en la sustentación.
- Al terminar cada unidad, indica qué SWR cubre, qué pruebas la acompañan y cómo ejecutarla.
