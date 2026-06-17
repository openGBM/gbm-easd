# Portal de Evaluaciones — GBM

**v1.3.4** · Portal web multi-instrumento para evaluaciones organizacionales. Permite aplicar distintos instrumentos de evaluación, gestionar sesiones con participantes, visualizar resultados con gráficos de radar, y generar análisis interpretativos con inteligencia artificial.

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

### Seguridad
- Proxy server-side (proxy.ts) para protección de rutas admin
- Rate limiting server-side: login, registro de encuestados, análisis IA
- Supabase Auth + RLS + default deny-all si ADMIN_EMAILS no está configurada
- Validación Zod en todos los API routes
- CSP diferenciada producción/desarrollo
- Sanitización de inputs en filtros de búsqueda
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
│       │   ├── admin/       # Panel admin (protegido)
│       │   │   ├── sesiones/
│       │   │   ├── instrumentos/
│       │   │   ├── encuestados/
│       │   │   └── consumo/
│       │   └── api/         # API routes
│       │       ├── analysis/
│       │       ├── auth/login/
│       │       ├── respondents/
│       │       └── usage/
│       ├── components/      # Componentes reutilizables
│       ├── lib/             # Supabase, logger, rate-limit, analytics
│       ├── types/           # Tipos TypeScript
│       └── proxy.ts         # Protección server-side de rutas
├── supabase/                # Migraciones SQL
├── docs/                    # Documentación
│   ├── instrumento-diagnostico-aidlc.md  # Instrumento AI-DLC
│   ├── manual-administrador.md           # Manual de usuario
│   └── vision.md                         # Visión del producto
├── aidlc-docs/              # Documentación de desarrollo (AI-DLC workflow)
└── .github/workflows/       # CI (GitHub Actions)
```

## Modelo de Datos

| Tabla | Descripción |
|-------|-------------|
| `instruments` | Instrumentos de evaluación (nombre, descripción, prompt IA) |
| `instrument_versions` | Versiones del banco (scale_labels, maturity_levels, is_current) |
| `sessions` | Sesiones de evaluación (ligadas a una versión de instrumento) |
| `dimensions` | Dimensiones con color (ligadas a versión) |
| `questions` | Preguntas por dimensión |
| `respondents` | Encuestados (nombre, correo, completado, tiempo) |
| `responses` | Respuestas (valor 1-5) |
| `session_analyses` | Análisis IA por sesión |
| `usage_logs` | Registro de consumo (usuario, acción, modelo, tokens) |

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
- [ ] v2.0 — Administración de usuarios y roles (admin, editor, viewer)
- [ ] v2.1 — Notificaciones por correo, exportar análisis IA a PDF
- [ ] v2.2 — Landing page del instrumento, tipos de pregunta variados
- [ ] v3.0 — SSO corporativo (SAML, OAuth)
- [ ] v4.0 — Multi-tenant, organizaciones aisladas

## Licencia

Proyecto interno de GBM. Todos los derechos reservados.
