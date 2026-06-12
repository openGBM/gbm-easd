# Documento de Requerimientos — Portal de Gestión de Evaluaciones de Autodiagnóstico

## Análisis de Intención

- **Solicitud del usuario**: Evolucionar el portal de autodiagnóstico EA a un portal multi-instrumento de evaluaciones
- **Tipo de proyecto**: Evolución de producto existente (Brownfield)
- **Estimación de alcance**: Múltiples componentes (frontend, backend, base de datos, feature flags)
- **Complejidad**: Alta — versionamiento de instrumentos, feature flags, retrocompatibilidad
- **Fase actual**: v1.x operativa, planificación de v2.x

---

## Requerimientos Funcionales

### RF-01: Registro de Encuestado
- El encuestado ingresa nombre y correo electrónico antes de responder
- No se requiere login/contraseña para el encuestado
- El sistema registra fecha y hora de la sesión automáticamente

### RF-02: Acceso por Enlace Público + QR
- La encuesta es accesible mediante un enlace público (sin autenticación)
- La interfaz debe mostrar un código QR con el enlace de la encuesta
- Solo se puede responder si la sesión está habilitada

### RF-03: Encuesta de Madurez EA
- Presentar 8 dimensiones de evaluación (del PDF EA in a Box)
- Cada dimensión contiene 6 preguntas específicas
- Cada pregunta se evalúa en escala 1-5 (escala de acuerdo)
- El encuestado selecciona el valor que refleje su grado de acuerdo con la eficacia de EA en cada dimensión
- Presentación tipo wizard/stepper: una dimensión por paso con barra de progreso
- Las respuestas se guardan en base de datos
- Si el encuestado se registró pero no completó, puede reanudar la encuesta

### RF-04: Visualización de Resultados
- Al finalizar, mostrar un gráfico de radar con el promedio por dimensión (escala 1-5)
- Mostrar una tabla resumen con suma por dimensión y nivel de madurez (Naciente/Base/Clase Mundial)
- Mostrar nivel de madurez global (suma total de todas las dimensiones)
- Los resultados son visibles inmediatamente al completar la encuesta (redirect automático)

### RF-05: Gestión de Sesiones (Admin)
- El admin puede crear nuevas sesiones
- El admin puede habilitar/deshabilitar sesiones
- Una sesión deshabilitada no permite nuevas respuestas
- Cada sesión tiene un enlace único

### RF-06: Panel de Administración
- Dashboard global con métricas: sesiones habilitadas, respuestas totales, tiempo promedio
- Dashboard con lista de sesiones (activas/inactivas) con conteo de encuestados
- Vista detallada de sesión con dashboard específico (respuestas y tiempo promedio de esa sesión)
- Vista detallada de sesión con lista de encuestados (nombre, email, estado, fecha)
- Vista de resultados por encuestado individual (radar + tabla)
- Vista consolidada: promedio de todos los encuestados completados en una sesión
- Exportar respuestas a Excel (.xlsx) con hojas de resumen y detalle
- Capacidad de eliminar sesiones completas (cascade) con confirmación
- Capacidad de eliminar encuestados y sus respuestas
- Acceso protegido por autenticación (verificación de email autorizado vía variable de entorno)

### RF-07: Autenticación de Admin
- Login con email y password via Supabase Auth
- Solo usuarios autorizados acceden al panel admin
- Protección de rutas admin en el frontend

### RF-08: Análisis IA de Resultados
- Análisis interpretativo generado por IA con estrategia de fallback (Gemini 2.0 Flash → Groq Llama 3.3 70B)
- Activado manualmente por el admin desde el detalle de sesión
- Requiere al menos un encuestado completado
- Genera análisis ejecutivo en español: resumen general, fortalezas, áreas de oportunidad, recomendaciones y hoja de ruta
- El análisis se renderiza con formato markdown (negritas, listas, encabezados)
- El análisis se guarda en BD para no regenerar cada vez
- Admin puede regenerar el análisis si lo desea
- Admin puede copiar el análisis al portapapeles
- Solo accesible para administradores autenticados

---

## Requerimientos Funcionales — v2.x (Multi-Instrumento)

### RF-09: Catálogo de Instrumentos
- El admin puede ver un catálogo de instrumentos disponibles
- Cada instrumento tiene nombre, descripción y estado (activo/inactivo)
- El instrumento "Autodiagnóstico de Arquitectura Empresarial" es el instrumento seed por defecto
- Tarjeta adicional en dashboard global mostrando cantidad de instrumentos disponibles

### RF-10: Versionamiento de Instrumentos
- Cada instrumento tiene un banco de dimensiones y preguntas versionado
- Si la versión actual NO tiene respuestas asociadas, se edita directamente (sin crear nueva versión)
- Si la versión actual YA tiene respuestas, se crea una nueva versión automáticamente al guardar cambios
- Una versión se marca como "actual" (is_current)
- Las sesiones se asocian a la versión específica con la que fueron creadas
- Los resultados de una sesión siempre se interpretan contra su versión asociada
- Versiones con respuestas son inmutables

### RF-11: Gestión de Dimensiones y Preguntas por Instrumento
- El admin puede crear/editar dimensiones para un instrumento (editor visual inline)
- El admin puede crear/editar/eliminar preguntas dentro de cada dimensión
- Editor visual: agregar dimensión (nombre), agregar pregunta (texto), eliminar dimensión/pregunta con confirmación
- Al guardar cambios se crea una nueva versión del instrumento (solo si hay respuestas)
- El historial de versiones es consultable
- Import/Export Excel sigue siendo compatible como método alternativo de edición

### RF-12: Sesiones Asociadas a Instrumento
- Al crear una sesión, el admin selecciona qué instrumento aplicar
- La sesión queda ligada al instrumento y su versión actual al momento de creación
- En el listado de sesiones se muestra un indicador del tipo de instrumento y versión aplicada
- Cada sesión aplica un único instrumento
- Filtros en listado: búsqueda por nombre + filtro por estado (todas/activas/inactivas)

### RF-13: Feature Flag Multi-Instrumento
- La funcionalidad multi-instrumento se gestiona con variable de entorno NEXT_PUBLIC_MULTI_INSTRUMENT
- Flag `true`: habilita multi-instrumento. `false` o ausente: comportamiento v1.x
- Gestionable desde Vercel env vars sin redeploy (requiere rebuild)
- Retrocompatible: con flag off, todo funciona como v1.x

### RF-14: Duplicar Instrumento
- El admin puede duplicar un instrumento existente desde el catálogo
- Se copia: nombre (con sufijo), descripción, expertise IA, versión actual (scale_labels, maturity_levels), dimensiones y preguntas
- El duplicado es independiente del original

### RF-15: Escalas y Niveles Editables Visualmente
- El admin puede editar las etiquetas de escala (1-5) desde la UI del instrumento
- El admin puede editar los niveles de madurez (nombre, color, rango min/max) desde la UI
- Validación: sin solapamientos, cobertura 1.0-5.0, min < max, color hex válido
- Se puede agregar/eliminar niveles (no limitado a 3)
- Los cambios se guardan en la versión actual del instrumento

---

## Requerimientos No Funcionales

### RNF-01: Seguridad de Datos
- Datos de encuestados (nombre, correo) protegidos con RLS en Supabase
- Panel admin solo accesible con sesión autenticada
- Comunicación HTTPS

### RNF-02: Idioma
- Toda la interfaz de usuario en español
- Mensajes de error y validación en español

### RNF-03: Responsividad
- Portal funcional en dispositivos móviles (para escanear QR y responder)
- Panel admin optimizado para desktop

### RNF-04: Rendimiento
- Carga de encuesta < 3 segundos
- Generación de gráfico de radar instantánea (client-side)

### RNF-05: Calidad y Testing
- Tests unitarios para lógica de negocio (niveles de madurez, validaciones)
- Tests E2E para flujos críticos (encuesta completa, admin, instrumentos)
- Test de concurrencia: 10 usuarios simultáneos sin conflictos de datos
- Cobertura: 52 tests (26 unit + 26 E2E)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React + Next.js 16 (TypeScript) |
| Visualización | Recharts (radar chart) |
| Exportación | ExcelJS |
| IA/Análisis | Google Gemini 2.0 Flash + Groq Llama 3.3 70B (fallback) |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Feature Flags | Vercel Flags (@flags-sdk/vercel) |
| Despliegue | Vercel (frontend), Supabase Cloud (BD) |
| Lenguaje | TypeScript |

---

## Modelo de Datos

### Tablas v1.x (actuales):
- **sessions**: id, name, is_active, created_at
- **dimensions**: id, name, description, display_order, color
- **questions**: id, dimension_id, text, display_order
- **respondents**: id, session_id, name, email, completed, completed_at, created_at
- **responses**: id, respondent_id, question_id, value (1-5), created_at
- **session_analyses**: id, session_id, analysis_text, generated_at, generated_by, total_respondents

### Tablas v2.x (nuevas — bajo feature flag):
- **instruments**: id, name, description, is_active, created_at
- **instrument_versions**: id, instrument_id, version_number, is_current, created_at
- **sessions**: agrega instrument_version_id (FK → instrument_versions, nullable para retrocompatibilidad)
- **dimensions**: agrega instrument_version_id (FK → instrument_versions, nullable para v1.x)

---

## Alcance v1.x — Completado ✅

| Feature | Usuario |
|---------|---------|
| Registro de encuestado (nombre, correo) | Encuestado |
| Encuesta de madurez EA (8 dimensiones, escala 1-5) | Encuestado |
| Gráfico de radar con resultados | Encuestado |
| Tabla resumen de valores por sesión | Encuestado |
| Gestión de sesiones (crear/habilitar/deshabilitar/eliminar) | Admin |
| Panel de administración con dashboards | Admin |
| Código QR del enlace de encuesta | Admin/Encuestado |
| Exportar respuestas a Excel | Admin |
| Análisis IA de resultados (Gemini/Groq) | Admin |

## Alcance v2.x — Planificado (bajo feature flag)

| Feature | Usuario |
|---------|---------|
| Catálogo de instrumentos | Admin |
| Versionamiento de banco de preguntas | Admin |
| Gestión de dimensiones/preguntas por instrumento | Admin |
| Sesiones asociadas a instrumento + versión | Admin |
| Indicador de instrumento/versión en listado | Admin |
| Tarjeta de instrumentos en dashboard | Admin |
| Feature flag multi-instrument (Vercel Flags) | Sistema |

## Fuera de Alcance

| Feature | Razón | Fase | Notas |
|---------|-------|------|-------|
| Escalas configurables por instrumento | Complejidad adicional, 8+ puntos de código afectados | Phase 3 | Agregar `scale_max` a instruments (default 5), etiquetas personalizadas, rango dinámico en wizard, recálculo de niveles de madurez. Preparar columna en migración sin activar. |
| Comparación entre versiones de un instrumento | Nice-to-have | Phase 3 | Diff visual entre bancos de preguntas |
| Exportación PDF de resultados | Nice-to-have | Phase 3 | |
| Multi-idioma | No prioritario | Phase 3 | |

---

## Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Feature flag mal configurado rompe funcionalidad v1.x | Alto | Tests exhaustivos con flag on/off, fallback a comportamiento v1.x |
| Migración de datos existentes a modelo multi-instrumento | Medio | Columnas nullable, instrumento seed automático, migración idempotente |
| Complejidad del versionamiento de instrumentos | Medio | Versionamiento simple (incremental), sin edición de versiones publicadas |
| Cuota de APIs de IA (Gemini/Groq) | Bajo | Fallback entre proveedores, retry con backoff |
