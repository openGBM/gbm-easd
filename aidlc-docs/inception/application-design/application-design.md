# Diseño de Aplicación — Portal de Autodiagnóstico EA

## Resumen

Aplicación Next.js (App Router) con TypeScript, desplegada localmente sobre Supabase. Arquitectura simple de 3 capas: páginas → servicios → Supabase.

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing/redirect
│   ├── encuesta/
│   │   └── [sessionId]/
│   │       └── page.tsx              # SurveyPage
│   ├── resultados/
│   │   └── [respondentId]/
│   │       └── page.tsx              # ResultsPage
│   └── admin/
│       ├── layout.tsx                # AdminLayout (protegido)
│       ├── login/
│       │   └── page.tsx              # LoginPage
│       ├── page.tsx                  # AdminDashboard
│       └── sesiones/
│           └── [id]/
│               └── page.tsx          # AdminSessionDetail
├── components/
│   ├── RadarChart.tsx                # Gráfico de radar (Recharts)
│   ├── QRCodeDisplay.tsx             # Generador de QR
│   ├── SurveyForm.tsx                # Formulario de encuesta (wizard/stepper)
│   ├── SurveyStepper.tsx             # Barra de progreso del wizard
│   ├── DimensionStep.tsx             # Paso individual (dimensión + escala 1-5)
│   └── ResultsTable.tsx              # Tabla resumen
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Cliente browser
│   │   ├── server.ts                 # Cliente server-side
│   │   └── middleware.ts             # Auth middleware
│   └── services/
│       ├── sessions.ts               # SessionService
│       ├── respondents.ts            # RespondentService
│       ├── responses.ts              # ResponseService
│       ├── dimensions.ts             # DimensionService
│       └── auth.ts                   # AuthService
└── types/
    └── database.ts                   # Tipos generados de Supabase
```

---

## Componentes Principales

| Componente | Tipo | Ruta | Protegido |
|------------|------|------|-----------|
| SurveyPage | Página | /encuesta/[sessionId] | No |
| ResultsPage | Página | /resultados/[respondentId] | No |
| LoginPage | Página | /admin/login | No |
| AdminDashboard | Página | /admin | Sí |
| AdminSessionDetail | Página | /admin/sesiones/[id] | Sí |
| RadarChart | Componente | — | — |
| QRCodeDisplay | Componente | — | — |

---

## Servicios

| Servicio | Tabla(s) | Operaciones |
|----------|----------|-------------|
| SessionService | sessions | CRUD, toggle estado |
| RespondentService | respondents | Crear, listar por sesión |
| ResponseService | responses | Crear batch, consultar por respondent |
| DimensionService | dimensions | Listar todas (read-only) |
| AuthService | Supabase Auth | signIn, signOut, getSession |

---

## Modelo de Datos

### sessions
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| name | text | Nombre descriptivo |
| is_active | boolean | Default true |
| created_at | timestamptz | Default now() |

### respondents
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| session_id | uuid (FK) | → sessions.id |
| name | text | Nombre del encuestado |
| email | text | Correo del encuestado |
| created_at | timestamptz | Default now() |

### dimensions
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| name | text | Nombre de la dimensión |
| description | text | Descripción breve |
| display_order | integer | Orden de presentación |

### responses
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| respondent_id | uuid (FK) | → respondents.id |
| dimension_id | uuid (FK) | → dimensions.id |
| value | integer | 1-5, CHECK constraint |
| created_at | timestamptz | Default now() |

---

## Seguridad (RLS)

- **sessions**: Lectura pública (para validar si activa), escritura solo admin autenticado
- **respondents**: Inserción pública (registro), lectura por admin
- **dimensions**: Lectura pública (necesario para la encuesta)
- **responses**: Inserción pública (el encuestado responde), lectura por admin + por respondent_id propio

---

## Dependencias del Proyecto

| Paquete | Propósito |
|---------|-----------|
| next | Framework React SSR/SSG |
| react, react-dom | UI library |
| @supabase/supabase-js | Cliente Supabase |
| @supabase/ssr | Auth helpers para Next.js |
| recharts | Gráfico de radar |
| qrcode.react | Generación de QR |
| tailwindcss | Estilos CSS utility-first |
