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
- Presentar 8-10 dimensiones de evaluación (del PDF EA in a Box)
- Cada dimensión se evalúa en escala 1-5
- El encuestado selecciona el valor que refleje su grado de acuerdo con la eficacia de EA en cada dimensión
- Las respuestas se guardan en base de datos

### RF-04: Visualización de Resultados
- Al finalizar, mostrar un gráfico de radar con los valores por dimensión
- Mostrar una tabla resumen con los valores numéricos de la sesión
- Los resultados son visibles inmediatamente al completar la encuesta

### RF-05: Gestión de Sesiones (Admin)
- El admin puede crear nuevas sesiones
- El admin puede habilitar/deshabilitar sesiones
- Una sesión deshabilitada no permite nuevas respuestas
- Cada sesión tiene un enlace único

### RF-06: Panel de Administración
- Dashboard con lista de sesiones (activas/inactivas)
- Vista de encuestados por sesión
- Vista de respuestas por encuestado
- Acceso protegido por autenticación

### RF-07: Autenticación de Admin
- Login con email y password via Supabase Auth
- Solo usuarios autorizados acceden al panel admin
- Protección de rutas admin en el frontend

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
- **sessions**: id, name, is_active, created_at, qr_url
- **respondents**: id, session_id, name, email, created_at
- **responses**: id, respondent_id, dimension_id, value (1-5), created_at
- **dimensions**: id, name, description, order

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
