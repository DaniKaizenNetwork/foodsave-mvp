# Componentes de la plantilla que se reutilizan (Prompt 1)

Plantilla de referencia: [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter), analizada en una copia fuera de este repositorio (commit `89f4e25`). Este documento solo explica el análisis; la implementación sigue `plan_aprobado.md`.

## Hallazgos de la plantilla
- Next 16, React 19, Tailwind 4, shadcn con base-ui, TanStack Table/Form/Query, nuqs, zod.
- Clerk está en `src/proxy.ts`, `app/auth/*`, `app/dashboard/layout.tsx`, `user-nav`, perfil, workspaces, billing y `config/infoconfig.ts`.
- Los datos son falsos (faker) en `app/api/products|users` y `features/*/api`.
- El tema vive en `src/styles/theme.css` y `src/styles/themes/*.css` (10 temas, selector `data-theme`).

## Qué se reutiliza, por pantalla

Estructura común: `components/layout/{app-sidebar, header, page-container, providers, sidebar-toggle, user-nav}`, `components/ui/{sidebar, card, table, button, input, field, badge, sonner, skeleton, empty, alert, dialog, alert-dialog, select, breadcrumb, avatar, dropdown-menu}` y `hooks/{use-nav, use-breadcrumbs, use-debounce}`.

| Pantalla (ruta) | Se reutiliza | Adaptación |
|---|---|---|
| **Login** `/login` | `app/auth/layout`, `features/auth/components/sign-in-view` (layout dividido con panel de marca), `interactive-grid`, `user-auth-form`, `ui/field`, `input`, `button`/`loading-button`, `card` | Se reemplaza `<SignIn/>` de Clerk por `LoginForm` (correo, contraseña, «Ingresar») contra `POST /auth/login`. Error con `role="alert"`: «Credenciales inválidas». Se quita `github-auth-button`. Navega a `/ofertas`. |
| **Registro** `/registro` | `sign-up-view`, mismo layout, `components/forms/fields/text-field`, `form.ts` y `form-context.ts` (TanStack Form + zod) | `RegisterForm` (nombre, correo, contraseña, «Registrarse») contra `POST /auth/register`; un mensaje obligatorio por campo; «Cuenta creada correctamente» dentro del componente. |
| **Listado y búsqueda de ofertas** `/ofertas` (público, `?q=`) | `features/products/components/product-listing` y `product-tables`, `data-table/*` (toolbar), `page-container`, `card`, `badge`, `skeleton`, `empty`, `use-debounce`, `nuqs` para `?q=` | `ListaOfertas`: cards con precio original tachado, precio de oferta, descuento, unidades, vencimiento y sede; campo «Buscar ofertas» y botón «Buscar». Estados: «Cargando ofertas…», «No hay ofertas disponibles», «No se encontraron ofertas para tu búsqueda». `ReservaForm` (cantidad + «Reservar») en dialog/sheet, solo con sesión CONSUMIDOR; muestra plazo de retiro, «Reserva confirmada» y errores 409. El visitante ve el header con «Ingresar». |
| **Publicar oferta** `/ofertas/nueva` (DUENO, PERSONAL) | `features/products/components/product-form` (card + grid de campos), `product-view-page`, `text-field`, `date-picker-field`, `select-field`, `submit-button` | `OfertaForm`: producto, precio original, precio de oferta, cantidad, vencimiento y sede (selector con `GET /sedes/mias`). Validación y mensajes del contrato; «Oferta publicada». Envuelto en `RutaProtegida`. Se descartan `file-upload-field` (imagen) y categorías. |
| **Mis reservas** `/reservas` (CONSUMIDOR) | `features/users/components/users-table` (`columns`, `cell-action`), `data-table/*`, `alert-dialog`, `badge`, `lib/format.ts` | Tabla de `GET /reservas/mias`: producto, cantidad, estado, plazo de retiro y acción «Cancelar»; «Reserva cancelada» dentro del componente. |
| **Reservas de la sede** `/gestion/reservas` (PERSONAL, DUENO) | La misma tabla y `cell-action`, `data-table-faceted-filter` (estado), `data-table-toolbar` | Tabla de `GET /reservas?sedeId=&estado=` con «Marcar entregada»; «Reserva marcada como entregada» dentro del componente. |

**Shell:** `app-sidebar` se conserva con navegación por rol en `config/nav-config.ts` (se reutiliza `access: { role }`, sustituyendo las comprobaciones de Clerk por el rol de nuestra sesión). `user-nav` muestra nombre y rol, y «Cerrar sesión» solo borra el token local.

**Mensajes visibles en el componente.** Los mensajes que verifican las pruebas RTL («Cuenta creada correctamente», «Oferta publicada», «Reserva confirmada», «Reserva cancelada», «Reserva marcada como entregada» y los errores) se muestran dentro del propio componente, con `role="status"` (éxitos) o `role="alert"` (errores). El toast de sonner puede añadirse, pero nunca es el único canal, porque RTL no ve los toasts sin montar el `Toaster`.

## Qué se descarta
- **Dependencias:** `@clerk/nextjs`, `@sentry/nextjs`, `ai`, `@ai-sdk/react`, `@dnd-kit/*`, `recharts`, `@faker-js/faker`, `embla-carousel-react`, `react-resizable-panels`, `react-dropzone`, `input-otp`, `react-responsive`, `sort-by`, `@tanstack/react-query-devtools`, **`kbar`** (y `components/kbar`). Los hooks de husky/lint-staged se evalúan. Se conservan next, react, tailwind 4, base-ui, utilidades shadcn, TanStack Table/Form/Query, nuqs, zod, sonner, next-themes, date-fns, tabler icons y zustand (solo si se usa para la sesión).
- **Páginas y carpetas:** `dashboard/{overview, workspaces, billing, exclusive, kanban, chat, ai-chat, elements, forms, react-query, profile, notifications, product, users}`, `features/{overview, kanban, chat, ai-chat, elements, forms, profile, notifications, react-query-demo}`, `app/api/{products,users}` y `features/*/api` con datos faker, `components/layout/{cta-github, info-sidebar}`, `config/infoconfig.ts`, componentes `ui` sin uso (`kanban`, `chart`, `message*`, `bubble`, `attachment`, `carousel`…), 9 de los 10 temas y el selector de temas, `src/proxy.ts` (Clerk), configuración de Sentry, `Dockerfile*`, `bunfig.toml`, `bun.lock`, `skills-lock.json`, `AGENTS.md`/`CLAUDE.md`/`docs` de la plantilla y los recursos de demostración de `public/`. Los scripts que llaman a `bun` se reescriben con npm.
- **Fuera de alcance:** recuperar contraseña, perfil, administración de sedes, comercios y categorías.
- Criterio de salida de la limpieza: `npm run build` y `typecheck` sin errores ni imports huérfanos, y `grep -ri clerk apps/web` vacío.

## Cómo se aplica la marca
- **Tokens:** los valores de `docs/marca/brand-tokens.css` se mapean a las variables que la plantilla usa (`--background`, `--card`, `--primary`, `--secondary`, `--accent`, `--muted`, `--border`, `--ring`, `--destructive`, `--sidebar*`, `--radius`) en un único tema `foodsave.css` (claro y `.dark`) que sustituye a los 10 temas. Los nombres se verifican contra `theme.css`. El acento `#F26B21` y las variables `--fs-*` se exponen en `@theme inline` para el badge de descuento y los CTA.
- **Tipografía:** Fredoka (600, 700) y Nunito (400, 600, 700) con `next/font/google` en `app/layout.tsx`, como `--font-heading` y `--font-sans`; `h1–h4`, `CardTitle` y el título del sidebar usan Fredoka. Se elimina la regla de la plantilla que anula `--font-sans` con `initial`.
- **Logo:** `foodsave-logo-horizontal-claro.svg` en el sidebar oscuro (el isotipo `foodsave-icon.svg` al colapsar), `foodsave-logo-horizontal.svg` en login, registro y header público, y `favicon.svg` como icono. Los SVG se copian a `apps/web/public/`; los de `docs/marca` no se mueven.
- **Sidebar y componentes:** `--sidebar #0F4F2E`, ítem activo en amarillo `#F7B21A` con texto marrón; cards con radio 0.75rem y bordes crema; botón primario verde; badge de descuento naranja; badges de estado de reserva (RESERVADA amarillo, ENTREGADA verde, CANCELADA destructivo).
- Metadatos en español (`lang="es"`, título «FoodSave»), `themeColor` de marca y toggle claro/oscuro con `next-themes`.
