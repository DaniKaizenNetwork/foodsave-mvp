# Prompts para Claude Code · Etapa 6

Se usan en este orden, en **una sola sesión** de Claude Code abierta en la raíz del repositorio (rama `develop` actualizada, con `CLAUDE.md` y `docs/` ya presentes).

Sugerencia: activa el **modo plan** de Claude Code (Shift+Tab hasta que muestre «plan mode»). En ese modo la IA no escribe archivos hasta que apruebes el plan. Guarda capturas de ambas respuestas: son evidencia para el informe.

---

## Prompt 1 · Apariencia (la IA solo explica; no modifica nada)

```
Usa esta plantilla de dashboard Next.js como referencia visual: https://github.com/Kiranism/next-shadcn-dashboard-starter (demo: https://shadcn-dashboard.kiranism.dev/).

El software se llama FoodSave. Es una plataforma web para publicar productos próximos a vencer con descuento y reservarlos, con pago y recogida en la sede.

Logo: usa docs/marca/logo/foodsave-icon.svg (isotipo), docs/marca/logo/foodsave-logo-horizontal.svg (para fondos claros) y docs/marca/logo/foodsave-logo-horizontal-claro.svg (para el sidebar oscuro). El favicon es docs/marca/logo/favicon.svg.

Colores de marca: primario #14683B, secundario #F7B21A, acento #F26B21. Los tokens completos (fondos, bordes, modo oscuro) están en docs/marca/brand-tokens.css.

Tipografía: Fredoka (600 y 700) para títulos y Nunito (400, 600 y 700) para el cuerpo, con next/font/google.

Mantén la estructura visual de la plantilla: sidebar, cards, tablas, formularios, espaciados y estilo general.

Adapta la interfaz a la identidad de marca. No cambies a un diseño genérico diferente.

Restricciones del proyecto: no uses el proveedor de autenticación ni la base de datos de la plantilla (por ejemplo Clerk u otros servicios externos); la autenticación y los datos van contra nuestra API NestJS. Elimina las páginas de demostración que no correspondan a los módulos del MVP.

Para poder analizarla, clona la plantilla en una carpeta temporal FUERA de este repositorio (por ejemplo /tmp/plantilla). No modifiques ningún archivo de este repositorio.

Antes de modificar archivos, explícame qué componentes de la plantilla reutilizarás: indica, para cada pantalla de FoodSave (login, registro, listado y búsqueda de ofertas, publicar oferta, mis reservas, reservas de la sede), qué componentes y qué estructura de la plantilla usarás, qué páginas o dependencias de la plantilla descartarás y cómo vas a aplicar la marca.
```

Revisa la respuesta. Si algo no te convence, pídelo en la misma sesión. Cuando estés de acuerdo, pasa al Prompt 2.

---

## Prompt 2 · Base de desarrollo (la IA presenta el plan y espera aprobación)

```
Analiza los SWR seleccionados y su trazabilidad SYS -> STK -> BR. Están en docs/srs/SWR_seleccionados.md; el alcance completo y las decisiones están en docs/srs/01_Alcance_y_Trazabilidad.xlsx (conviértelo a texto si necesitas leerlo), y las pruebas ya diseñadas están en docs/calidad/04_Matriz_Pruebas.xlsx (sobre todo las hojas «Contrato provisional» y «Datos y mensajes»).

Propón únicamente los módulos necesarios para ese alcance.

Debes mantener la plantilla visual seleccionada y los colores de marca.

Incluye autenticación y protege las rutas que lo requieran.

No implementes requisitos fuera del alcance.

Primero presenta el plan y espera aprobación.

Contexto adicional del proyecto (sigue también CLAUDE.md):
- Stack: Next.js + React + TypeScript en apps/web; NestJS + Prisma en apps/api; PostgreSQL en Supabase; monorepo con npm workspaces.
- El plan debe incluir: (1) estructura de carpetas del monorepo; (2) modelo de datos de Prisma (entidades, campos, relaciones y restricciones, incluido el correo único); (3) módulos, endpoints y funciones de dominio de NestJS, cada uno con el SWR que implementa y respetando la hoja «Contrato provisional»; (4) páginas y componentes del frontend con la ruta de cada una, el componente de la plantilla que reutiliza y el SWR que cubre; (5) el diseño de logs del backend; (6) las semillas y las variables de entorno; (7) el orden de desarrollo en ramas y PR, de modo que primero quede completa la autenticación y después el flujo principal; (8) para cada SWR, la prueba unitaria que acompañará a la regla; (9) las decisiones que debo aprobar y los riesgos que ves.
- Marca explícitamente cualquier punto en el que el contrato, la matriz de pruebas o el SRS parezcan contradecirse, en lugar de resolverlo en silencio.
- No escribas código ni crees archivos hasta que yo apruebe el plan. Cuando lo apruebe, tu primera acción será guardar este plan en docs/plan/plan_aprobado.md y tu explicación de componentes del Prompt 1 en docs/plan/componentes_plantilla.md, en una rama docs/plan-desarrollo.
```

---

## Qué hacer con la respuesta
1. Compárala con `06_Plan_Desarrollo_IA.pdf` (plan de referencia y criterios de aprobación).
2. Si faltan puntos o hay alcance de más, pide ajustes en la misma sesión. Cada ronda de ajustes se anota en el registro de aprobación.
3. Aprueba solo cuando el plan cumpla todos los criterios.
