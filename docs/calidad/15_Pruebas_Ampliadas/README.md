# Pruebas ampliadas (AMP-01 a AMP-35)

Pruebas adicionales que completan las de la matriz (`04_Matriz_Pruebas.xlsx`) usando técnicas de diseño que no se habían aplicado del todo: **MC/DC**, **valores límite**, **tabla de decisión**, **adivinación de errores** y **pruebas de caracterización**. No se modificó código de producción: solo se agregaron archivos de prueba.

## Archivos

| Archivo | IDs | Qué prueba | SWR |
|---|---|---|---|
| `apps/api/src/reservas/verificar-reserva.ampliadas.spec.ts` | AMP-01 a AMP-06 | MC/DC de la condición de cantidad, NaN e Infinity, vencimiento 1 ms después, stock 1, prioridad vencido > stock | RES-001, RES-002 |
| `apps/api/src/ofertas/validar-oferta.ampliadas.spec.ts` | AMP-07 a AMP-11 | Precio mayor, cantidad NaN, precio negativo y 0 (caracterización), descuento de 1 peso | OFE-003 |
| `apps/api/src/reservas/plazo-cierre.ampliadas.spec.ts` | AMP-12 a AMP-16 | Empate cierre = vencimiento, reserva 23:59, sede ya cerrada, domingo y sábado, cierre «01:00» | RES-005 |
| `apps/api/src/auth/auth-dto.ampliadas.spec.ts` | AMP-17 a AMP-22 | Normalización del correo, contraseña sin recortar, campos inválidos, contraseña de 1 carácter y correo sin «@» (caracterización) | AUTH-001, AUTH-005 |
| `apps/api/src/common/logging/redact.ampliadas.spec.ts` | AMP-23 a AMP-26 | Mayúsculas, referencias circulares, fechas, campos «clave» y «refreshToken» (caracterización) | Logs / Seguridad |
| `apps/web/src/lib/validar-y-formato.ampliadas.test.ts` | AMP-27 a AMP-35 | Formulario de ofertas igual a la regla de la API y formato de precios en COP | OFE-003, BUS-001 |

## Pruebas de caracterización (hallazgos)

Una prueba de **caracterización** documenta cómo se comporta el código **hoy**, aunque no sea lo ideal. Si alguien corrige el código, la prueba falla y obliga a actualizarla con la nueva regla: el cambio queda visible y trazado.

| Prueba | Comportamiento actual | Riesgo | ISO 25010 |
|---|---|---|---|
| AMP-09 / AMP-33 | Se acepta un precio de oferta negativo | Ofertas sin sentido de negocio | Adecuación funcional |
| AMP-10 | Se acepta un precio de oferta 0 | El SRS no define si regalar es válido | Adecuación funcional |
| AMP-14 | Con la sede ya cerrada el plazo queda en el pasado | Lo evita la verificación previa | Fiabilidad |
| AMP-16 | Un cierre «01:00» se toma como la 1 a. m. del mismo día | Sedes que cierran de madrugada | Adecuación funcional |
| AMP-21 | Se acepta una contraseña de 1 carácter | Cuentas fáciles de adivinar | Seguridad |
| AMP-22 | Se acepta un correo sin «@» | Datos de contacto inválidos | Adecuación funcional |
| AMP-26 | Campos «clave» o «refreshToken» no se ocultan en los logs | Fuga de secretos si se agregan esos campos | Seguridad |

## Cómo ejecutarlas

```bash
npx jest --config apps/api/jest.config.js --testRegex "ampliadas\.spec\.ts$" --verbose
npm test -w apps/web
```

> El proyecto exige Node.js 22.12 o superior. Con Node 20, Vitest no arranca (error de `undici`); en ese caso se puede usar `npx -y node@22 ../../node_modules/vitest/vitest.mjs run` desde `apps/web`.

## Resultado de la ejecución real (19/11/2026)

| Suite | Resultado |
|---|---|
| Jest, solo pruebas ampliadas | 5 archivos, **31 pruebas, 31 aprobadas** |
| Jest, API completa con cobertura (`npm run test:cov -w apps/api`) | 21 archivos, **145 pruebas, 145 aprobadas**; el umbral del 90 % en el dominio se cumple |
| Vitest, web completa | 7 archivos, **24 pruebas, 24 aprobadas** (12 RTL + 12 ampliadas) |
| ESLint y `tsc --noEmit` (api y web) | 0 errores |

Evidencia: `resultado_jest_ampliadas.txt`, `resultado_jest_api_completo_cobertura.txt` y `resultado_vitest_web.txt`.
