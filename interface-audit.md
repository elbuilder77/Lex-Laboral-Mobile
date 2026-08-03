# Auditoría combinada de interfaz móvil — Lex Laboral

## Alcance

Flujo móvil a 390 × 844: Inicio → Finiquito vacío → validación → resultados → IMSS → Docs IA. Evidencia capturada el 2 de agosto de 2026 con Chrome y guardada en `scratch/interface-audit/`.

## Objetivo del usuario y referencia de accesibilidad

Completar cálculos laborales y generar documentos desde un teléfono sin recortes, bloqueos, controles diminutos ni cambios bruscos de modelo visual. La revisión usa riesgos WCAG como referencia, pero no afirma conformidad completa.

## Pasos y salud

1. **Inicio — deficiente.** La marca es reconocible, pero la pantalla sigue siendo una portada extensa de escritorio comprimida. El logo ocupa demasiado espacio, no hay `h1`, las tarjetas contienen demasiado texto y los enlaces Términos/Privacidad tienen solo 15 px de alto.
2. **Finiquito vacío — aceptable con deuda.** Es la pantalla más coherente y legible. No hay desbordamiento horizontal. Sin embargo, “Prestaciones y parámetros” existe como control enfocable de 1 × 1 px.
3. **Validación — bloqueante.** El aviso aparece encima del botón principal, intercepta los toques y su cierre mide 16 × 16 px. Un error no se descarta automáticamente.
4. **Resultados — mejorable.** El total es claro, pero la cabecera conserva contenido del formulario y el cambio de estado depende de un botón genérico “Formulario”. El aviso de éxito cubre parte del desglose.
5. **IMSS — deficiente.** Regresa a una cabecera oscura voluminosa, pestañas de 41 px y tarjetas grandes con contraste muy bajo. No comparte el sistema visual ni la densidad de Finiquito.
6. **Docs IA — deficiente.** Repite el patrón sobredimensionado de IMSS, muestra carruseles/tarjetas parcialmente visibles y el aviso global heredado cubre variables del formulario.

## Fortalezas

- No se detectó desbordamiento horizontal en las seis capturas.
- La navegación inferior mantiene cuatro destinos estables y una indicación activa consistente.
- Finiquito tiene una jerarquía móvil clara, controles de entrada legibles y acción primaria visible.
- No se registraron errores de consola durante el recorrido.

## Riesgos UX priorizados

- **P0 — Avisos globales bloqueantes.** Evidencia: `03-validacion-error.png`. El aviso interceptó el siguiente toque sobre “Calcular estimación”; el flujo automatizado no pudo continuar sin cerrarlo manualmente.
- **P1 — Tres sistemas visuales dentro de la misma app.** Evidencia: `contact-sheet.png`. Inicio, Finiquito e IMSS/Docs usan densidades, encabezados, superficies y escalas distintas, lo que hace sentir cada destino como un producto diferente.
- **P1 — Inicio no prioriza una tarea móvil.** Evidencia: `01-inicio.png`. El usuario debe atravesar un logo enorme y tarjetas de marketing antes de decidir una acción.
- **P1 — Contenido cubierto por avisos entre módulos.** Evidencia: `04-resultados.png`, `05-imss.png`, `06-docs-ia.png`. El estado global persiste durante la navegación y tapa información o controles.
- **P2 — Patrón de pestañas y encabezados duplicado.** Cada calculadora implementa su propia cabecera, tabs, espaciado y radios; esto aumenta deriva visual y costo de mantenimiento.
- **P2 — Resultados sin resumen de datos de entrada.** Es difícil verificar si el total corresponde al salario, fechas y motivo capturados antes de exportar.

## Riesgos de accesibilidad

- **P0 — Elemento enfocable de 1 × 1 px.** `Prestaciones y parámetros` está visualmente oculto con `sr-only`, pero permanece en el orden de foco.
- **P1 — Cierre de avisos de 16 × 16 px.** No alcanza el objetivo táctil recomendado de 44 × 44 px y no tiene nombre accesible visible en la captura/DOM.
- **P1 — Contraste bajo en IMSS y Docs IA.** Etiquetas y campos deshabilitados/apagados usan grises muy claros sobre blanco.
- **P2 — Inicio carece de encabezado principal.** La primera jerarquía semántica capturada empieza en `h2`.
- **P2 — Enlaces legales con 15 px de alto.** Términos y Privacidad son objetivos táctiles insuficientes.
- **P2 — Pestañas de 41 px.** “Formulario/Resultados” e “Formulario/Borrador” quedan ligeramente por debajo de 44 px.

## Oportunidades

1. Crear una cabecera móvil compartida para todas las herramientas.
2. Convertir Inicio en un lanzador breve de tareas; mover explicación RAG y textos largos a una sección secundaria.
3. Centralizar campos, pestañas, avisos, superficies, espaciado y tamaños táctiles en componentes/tokens.
4. Usar validación inline junto al campo y reservar avisos globales para confirmaciones no bloqueantes.
5. Limpiar los avisos al cambiar de módulo y evitar que intercepten la acción principal.

## Límites de evidencia

Las capturas no verifican TalkBack, navegación completa con teclado, contraste medido por píxel, zoom del sistema Android, tamaños de fuente del sistema ni comportamiento con teclado virtual. Esas pruebas deben ejecutarse en un dispositivo o emulador.

## Recomendación de cierre

Corregir P0/P1 antes de considerar el APK definitivo: avisos, control oculto, consistencia de cabecera/densidad, Inicio móvil y tamaños táctiles. Después, compilar, sincronizar con Capacitor y validar nuevamente en 390 × 844.

## Remediación aplicada

- Los errores del cálculo ahora aparecen junto a Salario y Fechas; ya no bloquean ni cubren el botón principal.
- Los avisos globales se limpian al cambiar de módulo, se descartan automáticamente y su cierre mide 44 × 44 px con nombre accesible.
- “Prestaciones y parámetros” volvió a ser un control visible de 44 px, eliminando el foco oculto de 1 × 1 px.
- Inicio tiene `h1`, tarjetas móviles más breves, objetivos táctiles suficientes y contenido explicativo secundario oculto en teléfono.
- IMSS y Docs IA usan cabeceras más compactas, pestañas de 44 px y el mismo fondo cálido/base visual.
- Las fechas y errores de Finiquito ahora están asociados semánticamente con `label`, `aria-invalid` y `aria-describedby`.
- Evidencia posterior: `scratch/interface-audit-post/contact-sheet-final.png`; seis pantallas sin desbordamiento horizontal, objetivos visibles menores de 44 px ni errores de consola.

## Segunda remediación: Inicio y Pensiones

- Inicio fue reemplazado por un tablero nativo orientado a cuatro tareas; se retiraron hero comercial, badges promocionales, explicación RAG y tarjetas de landing.
- Pensiones se incorporó como quinto destino persistente y como herramienta principal del tablero.
- Los cinco destinos miden 76 × 68 px a 390 × 844, sin recortes ni desbordamiento.
- La pantalla de Pensión IMSS fue capturada y validada con formulario, regímenes Ley 1973/1997, parámetros y acción principal visibles.
- Evidencia: `scratch/native-home-audit/01-inicio-app.png` y `scratch/native-home-audit/02-pension.png`.
