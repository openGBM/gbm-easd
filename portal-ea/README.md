# Portal de Evaluaciones — GBM

**v3.0** · Portal web multi-instrumento y multi-tenant para evaluaciones organizacionales.  
Permite aplicar distintos instrumentos de evaluación, gestionar sesiones con participantes por áreas (tenants), controlar usuarios con roles jerárquicos, visualizar resultados con gráficos de radar, y generar análisis interpretativos con inteligencia artificial.

![Portal de Evaluaciones GBM](../docs/portal-inicio.png)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router, proxy.ts) |
| Lenguaje | TypeScript 6 |
| UI | React 19 + Tailwind CSS 4 |
| Visualización | Recharts (radar chart, bar chart) |
| QR | qrcode.react |
| Exportación | ExcelJS (dynamic import), jsPDF + html2canvas-pro |
| IA/Análisis | Google Gemini 2.0 Flash + Groq Llama 3.3 70B (fallback) |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Supabase Auth (email/password) + proxy server-side + roles (super_admin/admin/editor) |
| Rate Limiting | Upstash Redis (prod) / memoria con cleanup (dev) |
| Tenant Limits | lib/tenant-limits.ts (sesiones activas + análisis/mes por área) |

---

## Estructura del Proyecto

```
portal-ea/
├── src/
│   ├── app/
│   │   ├── page.tsx                         # Landing page
│   │   ├── layout.tsx                       # Root layout
│   │   ├── encuesta/[sessionId]/page.tsx    # Encuesta pública (wizard)
│   │   ├── resultados/[respondentId]/page.tsx # Resultados del encuestado
│   │   └── admin/
│   │       ├── layout.tsx                   # Layout protegido (auth)
│   │       ├── login/page.tsx               # Login admin
│   │       ├── page.tsx                     # Dashboard sesiones
│   │       ├── AdminNav.tsx                 # Navegación admin
│   │       ├── sesiones/[id]/page.tsx       # Detalle de sesión
│   │       ├── instrumentos/page.tsx        # Catálogo de instrumentos
│   │       ├── instrumentos/[id]/page.tsx   # Gestión de instrumento
│   │       ├── instrumentos/[id]/tendencias/page.tsx # Tendencias
│   │       ├── encuestados/page.tsx         # Historial de encuestados
│   │       └── consumo/page.tsx             # Tracking de consumo y tokens
│   ├── components/
│   │   ├── SurveyForm.tsx                   # Wizard de encuesta (registro + stepper)
│   │   ├── RadarChart.tsx                   # Gráfico de radar (Recharts)
│   │   ├── ResultsTable.tsx                 # Tabla resumen con nivel de madurez
│   │   ├── QRCodeDisplay.tsx                # Generador de código QR (con fullscreen)
│   │   ├── TrendBarChart.tsx                # Gráfico de barras para tendencias
│   │   ├── TrendTable.tsx                   # Tabla de datos de tendencias
│   │   ├── TrendFilters.tsx                 # Filtros de fecha y sesiones
│   │   ├── RespondentSearchBar.tsx          # Buscador de encuestados
│   │   ├── RespondentHistoryTable.tsx       # Tabla cronológica de historial
│   │   ├── RespondentRadarGrid.tsx          # Grid de radares por sesión
│   │   ├── ExportPdfButton.tsx              # Exportación a PDF
│   │   └── ResultsPageContent.tsx           # Wrapper de resultados con PDF
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                    # Cliente Supabase (browser)
│   │   │   └── server.ts                    # Cliente Supabase (server)
│   │   └── analytics/
│   │       ├── transformTrendData.ts        # Transformación datos tendencias
│   │       ├── transformRespondentHistory.ts # Transformación historial encuestado
│   │       └── filterTrendData.ts           # Filtros de tendencias
│   └── types/
│       └── database.ts                      # Tipos, escala de acuerdo, niveles de madurez
├── public/
│   └── logo-gbm.png                        # Logo GBM
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## Modelo de Datos

```
sessions (1) ──── (N) respondents (1) ──── (N) responses
                                                    │
dimensions (1) ──── (N) questions (1) ──────────── (N)
```

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `sessions` | Sesiones de evaluación (id, name, is_active, instrument_version_id, tenant_id, created_at) |
| `instruments` | Instrumentos de evaluación (id, name, description, ai_expertise_prompt, visibility, tenant_id, owner_id, is_active) |
| `instrument_versions` | Versiones del banco (id, instrument_id, version_number, version_tag, is_current, scale_labels, maturity_levels) |
| `dimensions` | Dimensiones con color (id, name, description, display_order, color, instrument_version_id) |
| `questions` | Preguntas por dimensión (id, dimension_id, text, display_order) |
| `respondents` | Encuestados (id, session_id, name, email, completed, completed_at, created_at) |
| `responses` | Respuestas (id, respondent_id, question_id, value 1-5, created_at) |
| `session_analyses` | Análisis IA por sesión (id, session_id, analysis_text, generated_at, generated_by) |
| `usage_logs` | Registro de consumo (id, user_email, action, model, input_tokens, output_tokens, tenant_id, metadata, created_at) |
| `tenants` | Áreas/equipos (id, name, description, max_active_sessions, max_analyses_per_month, is_active) |
| `profiles` | Perfiles de usuario (id, email, full_name, role, tenant_id, is_active) |
| `viewer_links` | Enlaces firmados (id, token, session_id, expires_at, is_revoked, created_by) |

---

## Funcionalidades Implementadas

### Encuestado
- **Landing page**: al acceder al enlace, ve nombre del instrumento, descripción, cantidad de dimensiones/preguntas, tiempo estimado, y botón "Comenzar"
- Acceso público por enlace `/encuesta/{sessionId}` (sin login)
- Registro con nombre y correo electrónico
- Encuesta tipo wizard/stepper: una dimensión por paso
- **Tres tipos de pregunta**: Likert (1-5), Boolean (Sí/No), Texto libre
- Escala configurable por instrumento con etiquetas personalizadas
- Preguntas marcadas como opcionales muestran indicador `(opcional)` y permiten avanzar sin responder
- Barra de progreso accesible con color por dimensión
- Navegación adelante/atrás entre dimensiones
- Validación de respuestas obligatorias antes de avanzar
- Reanudación si el encuestado ya se registró pero no completó
- Gráfico de radar con resultados al finalizar (solo preguntas Likert que contribuyen)
- Tabla resumen con nivel de madurez por dimensión
- **Pie charts** para preguntas boolean
- **Lista de respuestas abiertas** para preguntas de texto libre

### Usuarios, Roles y Multi-tenant (v2.1+)
- Login con email/password (Supabase Auth) con rate limiting server-side
- Roles: Super Admin (global), Admin de Área (su tenant), Editor (sesiones y resultados de su tenant)
- Viewer sin cuenta: acceso por enlace firmado (token temporal con expiración)
- Gestión de tenants (crear, editar límites, desactivar) desde panel Super Admin
- CRUD de usuarios (crear con contraseña generada, reset password, desactivar)
- Aislamiento por tenant en todos los datos (sesiones, instrumentos privados, consumo)

### Catálogo de Instrumentos (v2.2+)
- Visibilidad: público (visible para todos), privado (solo su tenant), template (solo super admin crea)
- Duplicar templates o instrumentos públicos como base para crear propios
- Restricción de visibilidad por rol en selector

### Límites y Consumo (v3.0)
- Enforcement de límites: max sesiones activas y max análisis IA por mes, configurables por tenant
- Validación server-side antes de crear sesión (`/api/sessions/check-limit`)
- Validación server-side antes de generar análisis IA (en `/api/analysis`)
- Dashboard de consumo filtrado por rol: Super Admin ve todo (con filtro por área), Admin ve su tenant, Editor ve solo su email
- Mensajes de error claros al alcanzar límites

### Administrador (general)
- Login con email/password (Supabase Auth) con rate limiting server-side
- Dashboard con métricas globales (sesiones activas, respuestas totales, tiempo promedio) cargadas en paralelo
- Dashboard con lista de sesiones (activas/inactivas)
- Crear nuevas sesiones (con log de uso automático)
- Habilitar/deshabilitar sesiones
- Eliminar sesiones con confirmación (cascade)
- Código QR generado para cada sesión con botones para copiar URL y copiar QR como imagen PNG
- Detalle de sesión con dashboard específico (respuestas y tiempo promedio de la sesión)
- Vista de resultados por encuestado individual
- Vista consolidada (promedio de todos los encuestados completados)
- Análisis IA (Gemini/Groq): interpretación ejecutiva con tracking de tokens consumidos por modelo
- Prompt de expertise IA con vista previa markdown (expand/collapse), textarea ampliado (12 rows, monospace) y límite de 6000 caracteres
- Prompts personalizados (>200 chars) usan su propio formato de respuesta con detalle por pregunta
- Editor visual de dimensiones: color editable vía color picker, descripción editable inline
- Versionamiento automático al agregar/eliminar dimensiones (si ya existen respuestas)
- Exportar respuestas a Excel (.xlsx) con 2 hojas: Resumen y Detalle (ExcelJS cargado bajo demanda)
- Exportar resultados a PDF (radar + tabla con título del instrumento)
- Eliminar encuestados y sus respuestas
- Tendencias por instrumento: gráfico de barras con evolución entre sesiones + filtros
- Historial de encuestados: búsqueda por email/nombre + tabla cronológica + radares por sesión
- Metadata dinámica en URLs de encuesta: OG tags muestran nombre del instrumento y sesión
- **Tracking de consumo**: sesiones creadas, análisis generados, tokens por modelo por usuario

### Seguridad
- Proxy server-side (proxy.ts) que verifica autenticación, perfil activo y rol antes de renderizar admin
- Supabase Auth con verificación contra tabla `profiles` + fallback legacy ADMIN_EMAILS (deny-all)
- RLS con aislamiento por tenant: helper functions `get_user_tenant_id()` y `is_super_admin()`
- Rate limiting server-side: login por IP, registro de encuestados por IP, análisis IA por usuario
- Validación Zod en todos los API routes + validación UUID en parámetros de ruta
- CSP diferenciada: `unsafe-eval` solo en desarrollo, removido en producción
- Sanitización de input en filtros de búsqueda PostgREST
- Token opaco con `crypto.randomUUID()` para viewer links (no predecible)
- Focus trap en modales (accesibilidad + prevención de interacción con background)

---

## Niveles de Madurez

Los niveles de madurez son **configurables por instrumento**. Cada instrumento define sus propios niveles con:
- Nombre personalizado (ej: "Naciente", "En progreso", "Optimizado")
- Color en formato hexadecimal (#RRGGBB)
- Rango de promedio mínimo y máximo (escala 1.0–5.0)

Se pueden definir 2, 3, 5 o cualquier cantidad de niveles. Los rangos deben cubrir de 1.0 a 5.0 sin huecos ni solapamientos.

Si un instrumento no define niveles explícitos, se calculan automáticamente por tercios:

| Rango (promedio) | Nivel | Color |
|------------------|-------|-------|
| 1.0 – 2.3 | Naciente | 🔴 Rojo |
| 2.4 – 3.6 | Base | 🟡 Amarillo |
| 3.7 – 5.0 | Clase Mundial | 🟢 Verde |

Los niveles se configuran desde el editor visual (sección "Niveles de Madurez") o mediante la hoja "Niveles" del Excel de importación.

---

## Ejecución Local

### Prerrequisitos
- Node.js 22+
- Supabase CLI (para base de datos local)
- Proyecto Supabase configurado con tablas y seed data

### Variables de entorno

Crear archivo `.env.local` en la raíz de `portal-ea/`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
ADMIN_EMAILS=tu-email@empresa.com
GEMINI_API_KEY=<tu-api-key-de-google-ai-studio>
GROQ_API_KEY=<tu-api-key-de-groq>
UPSTASH_REDIS_REST_URL=<tu-upstash-url>          # Opcional: rate limiting en producción
UPSTASH_REDIS_REST_TOKEN=<tu-upstash-token>      # Opcional: rate limiting en producción
```

> **Nota:** Se requiere al menos una de las dos keys de IA (GEMINI o GROQ). El sistema intenta Gemini primero y usa Groq como fallback. Si ADMIN_EMAILS no está configurada, nadie tiene acceso admin.

### Comandos

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar build
npm start

# Lint
npm run lint
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## Rutas de la Aplicación

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Landing page con enlace a admin |
| `/encuesta/[sessionId]` | Público | Encuesta (si sesión activa) |
| `/resultados/[respondentId]` | Público | Resultados del encuestado |
| `/viewer/[token]` | Público | Resultados por enlace firmado (viewer sin cuenta) |
| `/admin/login` | Público | Login de administrador |
| `/admin` | Protegido | Dashboard de sesiones |
| `/admin/sesiones/[id]` | Protegido | Detalle de sesión |
| `/admin/instrumentos` | Protegido | Catálogo de instrumentos |
| `/admin/instrumentos/[id]` | Protegido | Gestión de instrumento |
| `/admin/instrumentos/[id]/tendencias` | Protegido | Tendencias del instrumento |
| `/admin/consumo` | Protegido | Tracking de consumo (filtrado por rol) |
| `/admin/encuestados` | Protegido | Historial de encuestados |
| `/admin/usuarios` | Super Admin / Admin | Gestión de usuarios |
| `/admin/tenants` | Super Admin | Gestión de áreas (tenants) |

---

## API Routes

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/analysis` | POST | Genera análisis IA con Gemini/Groq (admin+, rate limited, check límite tenant) |
| `/api/auth/login` | POST | Login con rate limiting server-side por IP |
| `/api/catalog` | GET | Catálogo de instrumentos (filtrado por visibilidad y tenant) |
| `/api/catalog/duplicate` | POST | Duplicar instrumento como base propia |
| `/api/respondents` | POST | Registro de encuestados con validación Zod y rate limiting |
| `/api/sessions/check-limit` | GET | Verificar límite de sesiones del tenant actual |
| `/api/usage` | GET | Consumo filtrado por rol/tenant (super_admin, admin, editor) |
| `/api/users` | POST/PATCH | CRUD de usuarios (solo super_admin y admin) |
| `/api/viewer-link` | POST | Generar enlace firmado para viewer |

---

## Roadmap

### Corto plazo (próxima iteración)

- **SSO corporativo** (SAML, OAuth) — Login empresarial para clientes grandes.
- **Notificaciones por correo** — Admin recibe aviso al completar un encuestado; encuestado recibe enlace a sus resultados.
- **Exportar análisis IA a PDF** — Descargar el análisis interpretativo como PDF con branding GBM.

### Mediano plazo

- Multi-idioma (inglés, portugués)
- Billing/metering avanzado por tenant

### Largo plazo (postergado)

- PWA con soporte offline para encuestas
- Internacionalización completa (i18n)
