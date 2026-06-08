# Documento de Requerimientos — Portal de Autodiagnóstico EA

## Análisis de Intención

- **Solicitud del usuario**: Construir un portal web de autodiagnóstico de madurez de arquitectura empresarial para clientes GBM
- **Tipo de proyecto**: Nuevo producto (Greenfield)
- **Estimación de alcance**: Múltiples componentes (frontend, backend, base de datos)
- **Complejidad**: Moderada — CRUD con visualización y gestión de sesiones
- **Deadline**: 9 de junio de 2026 (2 días)

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

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React + Next.js (TypeScript) |
| Visualización | Recharts (radar chart) |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Despliegue MVP | Supabase local (producción futura: AWS) |
| Lenguaje | TypeScript |

---

## Modelo de Datos (Preliminar)

### Tablas principales:
- **sessions**: id, name, is_active, created_at
- **dimensions**: id, name, description, display_order, color
- **questions**: id, dimension_id, text, display_order
- **respondents**: id, session_id, name, email, completed, completed_at, created_at
- **responses**: id, respondent_id, question_id, value (1-5), created_at

---

## Alcance MVP — IN

| Feature | Usuario |
|---------|---------|
| Registro de encuestado (nombre, correo) | Encuestado |
| Encuesta de madurez EA (8-10 dimensiones, escala 1-5) | Encuestado |
| Gráfico de radar con resultados | Encuestado |
| Tabla resumen de valores por sesión | Encuestado |
| Gestión de sesiones (crear/habilitar/deshabilitar) | Admin |
| Panel de administración | Admin |
| Código QR del enlace de encuesta | Admin/Encuestado |

## Alcance MVP — OUT

| Feature | Razón | Fase |
|---------|-------|------|
| Despliegue en AWS | Restricciones de tiempo | Phase 2 |
| Comparación histórica entre sesiones | No es core MVP | Phase 2 |
| Exportación PDF de resultados | Nice-to-have | Phase 2 |

---

## Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Deadline extremo (2 días) | Alto | Priorizar features mínimas, usar Supabase para acelerar |
| Dimensiones del PDF no claras | Medio | Definir 8-10 dimensiones genéricas si PDF no es legible |
