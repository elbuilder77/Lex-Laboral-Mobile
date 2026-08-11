# Auditoría de producto, UX y growth — lanzamiento público

**Fecha:** 11 de agosto de 2026  
**Alcance:** versión Android actual de Lex Laboral, sin proponer cambios bloqueantes para el lanzamiento de hoy.

## Resumen ejecutivo

Lex Laboral ya comunica con claridad sus tres trabajos principales: calcular finiquito/liquidación, estimar cuotas IMSS/INFONAVIT y proyectar una pensión. La navegación inferior y el inicio orientado a tareas reducen la carga de decisión. El principal riesgo de producto no está en descubrir las herramientas, sino en que son utilidades de uso episódico: después de obtener y exportar un resultado, el usuario tiene pocos motivos naturales para regresar.

Para el lanzamiento se recomienda **no introducir gamificación, anuncios, paywalls ni permisos nuevos**. Primero conviene medir el embudo anónimo y validar demanda. Después, la retención debe basarse en valor jurídico real —guardar, actualizar, comparar y recordar—, no en rachas artificiales.

## 1. Análisis UX/UI

### Fortalezas actuales

- El inicio formula una pregunta orientada a intención ("¿Qué necesitas hacer?") y ofrece solamente tres herramientas con CTA específico.
- La navegación inferior mantiene cuatro destinos persistentes y etiquetas breves.
- Los cálculos restauran el último resultado guardado localmente, lo que reduce fricción al volver.
- Los flujos incluyen exportación PDF, una salida útil y compartible que completa la tarea principal.
- Términos y Privacidad están accesibles desde Inicio y la propuesta no requiere crear una cuenta.

### Fricciones y puntos de abandono

| Prioridad | Momento | Fricción | Impacto probable | Mejora concreta |
|---|---|---|---|---|
| P0 | Antes de instalar | La ficha de Play puede prometer más de lo que ofrece el binario si reutiliza el README, que menciona consulta IA, análisis documental, redactor y notificaciones no visibles en la app actual. | Desinstalación temprana, reseñas negativas y menor conversión de ficha. | Describir únicamente las tres calculadoras y la exportación PDF disponibles. Usar capturas reales y evitar claims de IA. |
| P1 | Primer cálculo | Los formularios legales solicitan datos que muchos usuarios no conocen (SDI/SBC, semanas, régimen, saldo AFORE). | Abandono antes del primer resultado. | Añadir, después del lanzamiento, ayudas contextuales breves: dónde encontrar cada dato y un ejemplo de formato. No añadir más campos al primer nivel. |
| P1 | Validación | Finiquito usa errores junto a campos, mientras Pensión todavía comunica varias validaciones mediante avisos globales. | El usuario sabe que algo falló, pero puede no identificar inmediatamente el campo a corregir. | Estandarizar validación inline por campo y mover el foco al primer error. Mantener el dato escrito. |
| P1 | Resultado | Se restaura automáticamente el último resultado, pero no existe un historial visible ni una etiqueta que explique fecha/escenario. | Confusión entre un cálculo nuevo y uno anterior; baja utilidad recurrente. | Mostrar "Último cálculo · fecha" y acciones explícitas "Editar datos", "Nuevo cálculo" y "Exportar PDF". |
| P1 | Confianza | El deslinde completo vive en Términos, lejos del momento de decisión. | Un total financiero preciso puede percibirse como dictamen legal. | Incluir bajo cada total: "Estimación informativa; verifica con un profesional" y la fecha de actualización normativa. |
| P2 | Arquitectura de navegación | Las vistas legales siguen mostrando la barra inferior de herramientas y su botón usa "Regresar al Ecosistema", lenguaje distinto a "Inicio". | Doble navegación y etiqueta poco natural en móvil. | Ocultar la barra de herramientas en vistas legales y cambiar el texto a "Volver a Inicio". |
| P2 | Resultado PDF | La exportación es una acción de alto valor, pero no hay evidencia en interfaz de qué incluye el PDF antes de generarlo. | Duda o intentos repetidos. | Anticipar el contenido: "Incluye datos, desglose, fecha y aviso legal". Confirmar éxito y ofrecer compartir. |

### Jerarquía recomendada para cada calculadora

1. **Título y alcance:** qué estima y para quién sirve.
2. **Datos imprescindibles:** sólo los campos necesarios para lograr el primer resultado.
3. **Opciones avanzadas:** colapsadas, con valores vigentes visibles.
4. **CTA primario:** usar verbo y resultado, por ejemplo `Calcular finiquito` en vez de un `Calcular` genérico.
5. **Resultado principal:** monto, periodo y escenario calculado.
6. **Confianza:** fecha normativa, supuesto principal y aviso de estimación.
7. **Siguiente acción:** editar, guardar/nombrar escenario, exportar o comparar.

### Embudo mínimo a medir

Sin capturar salarios, fechas, montos ni datos laborales, medir sólo eventos y propiedades categóricas:

1. `home_viewed`
2. `calculator_opened` (`labor`, `imss`, `pension`)
3. `calculation_started`
4. `validation_error` (sólo nombre del campo, nunca su valor)
5. `calculation_completed`
6. `pdf_exported`
7. `result_reopened`

Métricas base: activación (primer cálculo completado), finalización por herramienta, errores por campo, exportación PDF, retorno D1/D7/D30 y desinstalación/crash desde Play Console. La telemetría debe coincidir con el Aviso de Privacidad y la declaración Data Safety antes de activarse.

## 2. Retención y engagement

### Principio de diseño

Una app laboral no necesita una racha diaria: inventarla trivializaría una situación legal y produciría notificaciones sin valor. La recurrencia debe aparecer cuando cambia un cálculo, una norma o una fecha relevante elegida por el usuario.

### Plan D1, D7 y D30

| Horizonte | Objetivo | Mecanismo recomendado | Mensaje/experiencia | Condición y métrica |
|---|---|---|---|---|
| D1 | Completar el primer valor | Recuperación local del cálculo incompleto o último escenario, sin exigir cuenta. | En Inicio: "Continúa tu estimación" o "Revisa tu último resultado". | Sólo si existe estado local. Medir activación D1 y cálculo recuperado → completado. |
| D7 | Convertir un resultado en decisión | Recordatorio **opt-in** creado desde el resultado: revisar documentos, comparar una oferta o actualizar un dato. | "Hace una semana estimaste tu finiquito. Revisa los datos antes de tomar una decisión." | Pedir permiso de notificaciones únicamente después de que el usuario cree el recordatorio. Medir opt-in, apertura y reexportación. |
| D30 | Mantener vigencia y confianza | Resumen mensual o alerta normativa, opt-in y segmentada por herramienta usada. | "Revisa si tu estimación sigue vigente"; indicar claramente qué parámetro cambió y la fuente oficial. | Enviar sólo cuando exista cambio material o recordatorio solicitado. Medir retorno D30 y actualización completada. |

### Mecanismos priorizados

1. **Escenarios guardados localmente (alto valor, baja intrusión).** Permitir nombrar "Oferta empresa A" o "Pensión a los 60" y comparar dos resultados. Evitar cuenta en la primera versión.
2. **Recordatorios con intención (alto valor, permiso justificable).** El usuario elige fecha y motivo desde un resultado. No solicitar permiso push en el primer arranque.
3. **Alertas normativas verificadas (confianza y retorno).** Notificar cambios de UMA, salario mínimo o semanas requeridas únicamente con fuente y fecha efectiva.
4. **Progreso, no rachas.** Una lista opcional como "Datos completos → cálculo revisado → PDF exportado" es apropiada; puntos, badges y rachas diarias no lo son.
5. **Reward funcional.** Desbloquear comparación o checklist al completar un cálculo puede dar valor, pero nunca ocultar el resultado básico ni usar recompensas aleatorias.

### Experimentos posteriores al lanzamiento

- **E1 — CTA de Inicio:** `Calcular` frente a `Estimar mi finiquito`. Métrica: apertura → cálculo completado, no sólo clic.
- **E2 — Ayuda contextual:** ejemplo bajo el campo frente a icono de ayuda. Métrica: reducción de `validation_error` y finalización.
- **E3 — Próxima acción en resultados:** `Exportar PDF` frente a `Guardar escenario`. Métrica: acción de valor completada y retorno D7.

Ejecutar un experimento por vez, con criterio de éxito definido y sin enviar valores financieros a analítica.

## 3. Oportunidades de monetización

### 1. Freemium profesional por productividad — recomendada

Mantener gratis los tres cálculos, el resultado completo y una exportación básica. Cobrar a abogados, RH y contadores por historial multi-escenario, comparación, personalización de PDF, expedientes y exportación por lotes.

- **Por qué encaja:** monetiza uso profesional frecuente, no la vulnerabilidad del trabajador.
- **Modelo:** suscripción mensual/anual con prueba; compra gestionada por Google Play cuando aplique a funcionalidad digital.
- **Guardrail:** nunca degradar exactitud, ocultar el total ni bloquear el aviso legal en la versión gratuita.

### 2. Pago único por reporte profesional

Ofrecer un PDF premium claramente diferenciado: portada, supuestos, desglose, checklist documental, campos para notas y comparación de escenarios. Mostrar vista previa y precio antes de pagar.

- **Por qué encaja:** el usuario paga en el momento de máximo valor sin asumir una suscripción.
- **Modelo:** compra dentro de la app por reporte o paquete de créditos, validada en servidor.
- **Guardrail:** el PDF gratuito actual debe seguir disponible; el producto pago añade presentación y productividad, no certeza jurídica.

### 3. Referidos transparentes a profesionales verificados

Después del resultado, ofrecer opcionalmente "Hablar con un profesional" y cobrar al profesional una cuota fija por contacto calificado o una membresía de directorio.

- **Por qué encaja:** resuelve el siguiente paso natural cuando el caso requiere revisión humana.
- **Modelo:** listado separado del resultado, con ubicación/especialidad y consentimiento explícito antes de compartir datos.
- **Guardrail:** etiquetar contenido patrocinado, no vender datos de cálculo, no ordenar por pago sin indicarlo y revisar reglas profesionales/consumo aplicables.

### Qué no recomiendo al inicio

- Banners o intersticiales en formularios/resultados: dañan confianza y conversión.
- Venta de salarios, fechas, montos o perfiles laborales: incompatible con la promesa de privacidad.
- Paywall antes de mostrar el primer resultado: reduce activación y penaliza a usuarios en situación sensible.
- Suscripción genérica sin valor recurrente probado: aumenta cancelaciones y reseñas negativas.

## 4. Plan de lanzamiento y siguientes 30 días

### Hoy — publicación

- Publicar el binario ya validado sin incorporar SDKs, permisos o flujos nuevos.
- Alinear ficha, capturas, política de privacidad y Data Safety con el comportamiento real del binario.
- Describir la aplicación como calculadoras informativas; no prometer asesoría, IA ni notificaciones aún.
- Verificar el recorrido de instalación → primer cálculo → PDF en un dispositivo de producción.
- Configurar monitoreo de Android vitals, crashes, ANR y reseñas desde Play Console.

### Días 1–7 — aprender

- Responder reseñas y clasificar problemas por herramienta/campo.
- Registrar manualmente la línea base de instalación, activación, crash-free users y valoración.
- Si se añade analítica, diseñar primero el esquema sin datos financieros y actualizar consentimiento/privacidad/Data Safety antes del release.

### Días 8–30 — mejorar sin dispersión

1. Corregir el campo con mayor abandono.
2. Añadir confianza contextual al resultado (vigencia, supuestos, deslinde).
3. Probar recuperación del último cálculo como CTA de Inicio.
4. Validar interés profesional con entrevista y una pantalla de intención antes de implementar pagos.

## 5. KPIs y criterios de decisión

| Capa | KPI | Uso |
|---|---|---|
| Adquisición | Conversión de ficha de Play | Validar promesa, capturas y audiencia. |
| Calidad | Crash-free users, ANR, rating | Proteger distribución y confianza. |
| Activación | % de instalaciones con primer cálculo completado | North Star inicial. |
| Valor | % de cálculos con PDF exportado o escenario guardado | Confirmar utilidad, no sólo navegación. |
| Retención | D1/D7/D30 por herramienta | Separar uso episódico de uso profesional. |
| Monetización | Conversión y ARPPU por segmento profesional | Evitar optimizar ingresos a costa del usuario vulnerable. |

No fijar objetivos porcentuales arbitrarios antes de tener al menos una cohorte estable. Usar las primeras dos semanas como línea base y mejorar por herramienta y canal.

## Recomendación final

**Publicar hoy sin nuevas funciones**, siempre que el artefacto firmado y las validaciones técnicas de Play estén resueltas. La prioridad inmediata es coherencia entre promesa y producto. En crecimiento, el orden correcto es: medir activación de forma respetuosa, reducir el principal abandono, crear retorno mediante escenarios/recordatorios útiles y sólo después validar monetización profesional.
