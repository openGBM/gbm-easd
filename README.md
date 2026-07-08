# Portal de Evaluaciones — GBM

**v3.0** · Portal web multi-instrumento y multi-tenant para evaluaciones organizacionales. Permite aplicar distintos instrumentos de evaluación, gestionar sesiones con participantes por áreas (tenants), controlar usuarios con roles jerárquicos, visualizar resultados con gráficos de radar, y generar análisis interpretativos con inteligencia artificial.

![Portal de Evaluaciones GBM](docs/portal-inicio.png)

## Funcionalidades Principales

### Para el Encuestado
- Acceso mediante enlace público o código QR (sin login)
- Registro con nombre y correo (validado server-side con rate limiting)
- Encuesta tipo wizard/stepper con barra de progreso accesible
- Escala 1-5 con etiquetas personalizables por instrumento
- Navegación adelante/atrás entre dimensiones
- Reanudación si no completó la encuesta
- Visualización inmediata de resultados (gráfico de radar + tabla de madurez)
- Exportar resultados a PDF

### Para el Administrador
- Dashboard global con métricas (sesiones, respuestas, tiempo promedio, instrumentos) cargadas en paralelo
- Gestión de sesiones (crear, habilitar, deshabilitar, eliminar)
- Copiar URL y código QR como imagen PNG con un clic
- Dashboard por sesión con métricas específicas
- Vista individual y consolidada de resultados
- Análisis IA interpretativo bajo demanda (Gemini / Groq) con tracking de tokens
- Prompts personalizados con formato markdown y detalle por pregunta para cálculos granulares
- Exportar resultados a Excel (.xlsx) — cargado bajo demanda
- Gestión de instrumentos: editor visual (color, descripción, preguntas) + import/export Excel
- Versionamiento automático al modificar el banco (si ya hay respuestas)
- Etiquetas de escala y niveles de madurez configurables por instrumento
- Tendencias por instrumento entre sesiones (gráficos + filtros)
- Historial de encuestados (búsqueda por email, tabla cronológica, radares)
- Metadata dinámica en URLs compartidas (OG tags con nombre del instrumento)
- **Tracking de consumo**: sesiones creadas, análisis generados, tokens por modelo por usuario

### Usuarios y Roles (v2.1+)
- Roles jerárquicos: Super Admin (global), Admin de Área (su tenant), Editor (sesiones y resultados)
- Viewer sin cuenta: acceso por enlace firmado con token temporal y expiración
- Gestión de tenants (áreas): crear, editar límites, desactivar (soft delete)
- CRUD de usuarios desde panel Super Admin y Admin de Área
- Aislamiento por tenant: cada área solo ve sus propias sesiones, instrumentos privados y consumo

### Catálogo e Instrumentos (v2.2+)
- Instrumentos públicos, privados y templates
- Duplicar templates o instrumentos públicos como base
- Visibilidad controlada por rol (solo Super Admin puede crear templates)
- Enlace firmado para viewers (token opaco + expiración configurable)

### Límites y Consumo (v3.0)
- Enforcement de límites por tenant: sesiones activas y análisis IA por mes
- Validación server-side antes de crear sesión o generar análisis
- Dashboard de consumo filtrado por área (Super Admin ve todo, Admin ve su tenant)
- Mensajes de error amigables al alcanzar límites

### Seguridad
- Proxy server-side (proxy.ts) para protección de rutas admin con verificación de rol
- Rate limiting server-side: login, registro de encuestados, análisis IA
- Supabase Auth + RLS con aislamiento por tenant + default deny-all
- RLS policies con helper functions (`get_user_tenant_id()`, `is_super_admin()`)
- Validación Zod en todos los API routes
- CSP diferenciada producción/desarrollo
- Sanitización de inputs en filtros de búsqueda
- Token opaco con crypto random para viewer links
- Focus trap en modales (accesibilidad)

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router, proxy.ts) |
| Lenguaje | TypeScript 6 |
| UI | React 19 + Tailwind CSS 4 (responsive) |
| Visualización | Recharts (radar chart, bar chart) |
| QR | qrcode.react |
| Exportación | ExcelJS (dynamic import), jsPDF + html2canvas-pro |
| IA/Análisis | Google Gemini 2.0 Flash + Groq Llama 3.3 70B (fallback) |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Rate Limiting | Upstash Redis (prod) / memoria con cleanup (dev) |
| CI | GitHub Actions (Node.js 22, v5 actions) |
| Despliegue | Vercel (frontend) + Supabase Cloud (BD) |

## Requisitos Previos

- [Node.js](https://nodejs.org/) (v22+)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Docker](https://www.docker.com/) (para Supabase local)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/openGBM/gbm-easd.git
cd gbm-easd

# Iniciar Supabase local
supabase start

# Instalar dependencias
cd portal-ea
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar con credenciales de Supabase local

# Iniciar servidor de desarrollo
npm run dev
```

## Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
ADMIN_EMAILS=tu-email@empresa.com
GEMINI_API_KEY=<api-key-google-ai-studio>
GROQ_API_KEY=<api-key-groq>
UPSTASH_REDIS_REST_URL=<tu-upstash-url>          # Opcional: rate limiting en producción
UPSTASH_REDIS_REST_TOKEN=<tu-upstash-token>      # Opcional: rate limiting en producción
```

> **Nota:** Si ADMIN_EMAILS no está configurada, nadie tiene acceso admin (deny-all por defecto).

## Estructura del Proyecto

```
gbm-easd/
├── portal-ea/               # Aplicación Next.js
│   └── src/
│       ├── app/             # Páginas (App Router)
│       │   ├── encuesta/    # Encuesta pública
│       │   ├── resultados/  # Resultados públicos
│       │   ├── viewer/      # Resultados por enlace firmado (sin cuenta)
│       │   ├── admin/       # Panel admin (protegido por proxy + rol)
│       │   │   ├── sesiones/
│       │   │   ├── instrumentos/
│       │   │   ├── encuestados/
│       │   │   ├── consumo/
│       │   │   ├── usuarios/
│       │   │   └── tenants/
│       │   └── api/         # API routes
│       │       ├── analysis/       # Análisis IA (con check de límite)
│       │       ├── auth/login/
│       │       ├── catalog/        # Catálogo público/privado/templates
│       │       ├── respondents/
│       │       ├── sessions/check-limit/  # Enforcement de límites
│       │       ├── usage/          # Consumo filtrado por tenant/rol
│       │       ├── users/          # CRUD de usuarios
│       │       └── viewer-link/    # Generación de tokens firmados
│       ├── components/      # Componentes reutilizables
│       ├── lib/             # Supabase, logger, rate-limit, analytics, tenant-limits
│       ├── types/           # Tipos TypeScript
│       └── proxy.ts         # Protección server-side de rutas (auth + rol)
├── supabase/                # Migraciones SQL (schema + RLS)
├── docs/                    # Documentación
│   ├── instrumento-diagnostico-aidlc.md  # Instrumento AI-DLC
│   ├── manual-administrador.md           # Manual de usuario
│   └── vision.md                         # Visión del producto
├── Product-Definition/      # Definición de producto (AI-DLC Discovery)
├── aidlc-docs/              # Documentación de desarrollo (AI-DLC workflow)
└── .github/workflows/       # CI (GitHub Actions)
```

## Modelo de Datos

| Tabla | Descripción |
|-------|-------------|
| `tenants` | Áreas/equipos GBM (nombre, límites, is_active) |
| `profiles` | Perfiles de usuario (role, tenant_id, is_active) |
| `instruments` | Instrumentos de evaluación (visibility, tenant_id, owner_id) |
| `instrument_versions` | Versiones del banco (scale_labels, maturity_levels, is_current) |
| `sessions` | Sesiones de evaluación (tenant_id, instrument_version_id) |
| `dimensions` | Dimensiones con color (ligadas a versión) |
| `questions` | Preguntas por dimensión (type, contributes_to_score, is_required) |
| `respondents` | Encuestados (nombre, correo, completado, tiempo) |
| `responses` | Respuestas (value 0-5, text_value) |
| `session_analyses` | Análisis IA por sesión |
| `usage_logs` | Registro de consumo (user_email, action, model, tokens, tenant_id) |
| `viewer_links` | Enlaces firmados para viewers (token, session_id, expires_at) |

## Documentación

- [Manual del Administrador](docs/manual-administrador.md)
- [Instrumento AI-DLC](docs/instrumento-diagnostico-aidlc.md)
- [Visión del Producto](docs/vision.md)
- [README del Portal](portal-ea/README.md)

## Roadmap

- [x] v1.0 — MVP: Encuesta EA, radar, admin básico
- [x] v1.1 — Análisis IA, export Excel, dashboards
- [x] v1.2 — Multi-instrumento, versionamiento, import/export Excel, escalas y niveles configurables
- [x] v1.3 — Editor visual, tendencias, historial de encuestados, filtros
- [x] v1.3.4 — Instrumento AI-DLC, seguridad (proxy, rate limiting, CSP), consumo, responsive, accesibilidad
- [x] v2.0 — Landing page, tipos de pregunta (Likert/Boolean/Texto), preguntas opcionales, contributes_to_score
- [x] v2.1 — Administración de usuarios y roles (super_admin, admin, editor)
- [x] v2.2 — Catálogo de instrumentos, templates, viewer links, RLS por tenant
- [x] v3.0 — Enforcement de límites por tenant, dashboard de consumo por área
- [x] v3.1 — Abstracción arquitectónica (Hexagonal Architecture, Ports & Adapters)
- [ ] v4.0 — Multi-tenant completo (organizaciones aisladas, billing/metering)
- [ ] v5.0 — SSO corporativo (SAML, OAuth)

## Licencia

Proyecto interno de GBM. Todos los derechos reservados.
