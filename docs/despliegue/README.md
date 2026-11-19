# Despliegue del MVP (ambiente de prueba)

Fecha: 18 de noviembre de 2026.

| Pieza | Servicio | URL | Rama |
|---|---|---|---|
| Web (Next.js) | Vercel, plan Hobby | https://foodsave-mvp-pi.vercel.app | `main`, carpeta `apps/web` |
| API (NestJS) | Render, plan gratuito | https://foodsave-mvp-45bk.onrender.com | `develop` |
| Base de datos | Supabase (PostgreSQL) | no pública | n/a |

## Configuración

- API (Render): build `npm ci && npm run build -w apps/api`; arranque `npm run start:prod -w apps/api`; Node 22; despliegue automático desactivado.
- Web (Vercel): carpeta raíz `apps/web`, preset Next.js. `NEXT_PUBLIC_API_URL` se incrusta al compilar.
- Variables de entorno (solo nombres; los valores se cargan en cada panel y no están en el repositorio):
  - API: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_VERSION`.
  - Web: `NEXT_PUBLIC_API_URL`.
- `CORS_ORIGIN` debe ser el origen exacto de la web, con `https://` y sin barra final.
- No se cargaron `SEED_PASSWORD` ni `SEED_ALLOW_RESET` en el servidor: el seed no puede ejecutarse desde el ambiente publicado.

## Verificación

Se inició sesión como consumidor desde la URL pública y se consultó el listado de ofertas (captura: `captura_despliegue_publico.jpg`). Los logs JSON de la API se pueden consultar en el panel de Render (evento `SERVIDOR_INICIADO`).

## Limitaciones

- La API gratuita se duerme tras un rato sin uso; la primera petición tarda cerca de un minuto.
- La base es la misma del desarrollo; el seed la reinicia.
- Es un ambiente de demostración, sin dominio propio ni monitoreo.
