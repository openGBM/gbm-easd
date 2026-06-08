# Diseño de Aplicación — Portal de Autodiagnóstico EA

## Resumen

Aplicación Next.js (App Router) con TypeScript, desplegada localmente sobre Supabase. Arquitectura simple de 3 capas: páginas → servicios → Supabase.

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page
│   ├── encuesta/
│   │   └── [sessionId]/
│   │       └── page.tsx              # SurveyPage (server: valida sesión + carga dimensiones)
│   ├── resultados/
│   │   └── [respondentId]/
│   │       └── page.tsx              # ResultsPage (server: carga respuestas + radar)
│   └── admin/
│       ├── layout.tsx                # AdminLayout (server: verificación auth + email)
│       ├── AdminNav.tsx              # Navegación admin (client)
│       ├── login/
│       │   └── page.tsx              # LoginPage (client)
│       ├── page.tsx                  # AdminDashboard (client: CRUD sesiones)
│       └── sesiones/
│           └── [id]/
│               └── page.tsx          # AdminSessionDetail (client: detalle + consolidado)
├── components/
│   ├── SurveyForm.tsx                # Wizard completo (registro + stepper + envío)
│   ├── RadarChart.tsx                # Gráfico de radar (Recharts)
│   ├── ResultsTable.tsx              # Tabla resumen con nivel de madurez
│   └── QRCodeDisplay.tsx             # Generador de QR
├── lib/
│   └── supabase/
│       ├── client.ts                 # Cliente browser
│       ├── server.ts                 # Cliente server-side
│       └── middleware.ts             # Auth middleware helper
├── middleware.ts                     # Next.js middleware (protege /admin/*)
└── types/
    └── database.ts                   # Tipos, escala de acuerdo, niveles de madurez
```

---

## Componentes Principales

| Componente | Tipo | Ruta | Protegido | Renderizado |
|------------|------|------|-----------|-------------|
| SurveyPage | Página | /encuesta/[sessionId] | No | Server |
| ResultsPage | Página | /resultados/[respondentId] | No | Server |
| LoginPage | Página | /admin/login | No | Client |
| AdminDashboard | Página | /admin | Sí | Client |
| AdminSessionDetail | Página | /admin/sesiones/[id] | Sí | Client |
| SurveyForm | Componente | — | — | Client |
| RadarChart | Componente | — | — | Client |
| ResultsTable | Componente | — | — | Client |
| QRCodeDisplay | Componente | — | — | Client |
| AdminNav | Componente | — | — | Client |

---

## Servicios

**Nota**: La implementación final no usa una capa de servicios separada. Las operaciones de datos se realizan directamente con el cliente Supabase desde los componentes y páginas, siguiendo el patrón simple de 2 capas: componente → Supabase.

| Operación | Tabla(s) | Ubicación |
|-----------|----------|-----------|
| Validar sesión activa | sessions | EncuestaPage (server) |
| Cargar dimensiones + preguntas | dimensions, questions | EncuestaPage (server) |
| Registrar encuestado | respondents | SurveyForm (client) |
| Reanudar encuesta no completada | respondents, responses | SurveyForm (client) |
| Enviar respuestas (upsert batch) | responses | SurveyForm (client) |
| Marcar completado | respondents | SurveyForm (client) |
| Cargar resultados con joins | responses, questions, dimensions | ResultadosPage (server) |
| CRUD sesiones | sessions | AdminDashboard (client) |
| Toggle estado sesión | sessions | AdminDashboard (client) |
| Listar encuestados por sesión | respondents | AdminSessionDetail (client) |
| Ver respuestas individuales | responses, questions, dimensions | AdminSessionDetail (client) |
| Vista consolidada (promedio) | responses, questions, dimensions | AdminSessionDetail (client) |
| Eliminar encuestado + respuestas | respondents, responses | AdminSessionDetail (client) |
| Login/Logout | Supabase Auth | LoginPage, AdminNav (client) |

---

## Modelo de Datos

### sessions
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| name | text | Nombre descriptivo |
| is_active | boolean | Default true |
| created_at | timestamptz | Default now() |

### dimensions
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| name | text | Nombre de la dimensión |
| description | text | Descripción breve |
| display_order | integer | Orden de presentación |
| color | text | Color hex para UI (ej: #2563EB) |

### questions
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| dimension_id | uuid (FK) | → dimensions.id |
| text | text | Texto de la pregunta |
| display_order | integer | Orden dentro de la dimensión |

### respondents
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| session_id | uuid (FK) | → sessions.id |
| name | text | Nombre del encuestado |
| email | text | Correo del encuestado |
| completed | boolean | Default false — se marca true al enviar todas las respuestas |
| created_at | timestamptz | Default now() |

**Constraints**: UNIQUE (session_id, email)

### responses
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| respondent_id | uuid (FK) | → respondents.id |
| question_id | uuid (FK) | → questions.id |
| value | integer | 1-5, CHECK constraint |
| created_at | timestamptz | Default now() |

**Constraints**: UNIQUE (respondent_id, question_id)

---

## Seguridad (RLS)

- **sessions**: Lectura pública (para validar si activa), escritura solo admin autenticado
- **dimensions**: Lectura pública (necesario para la encuesta)
- **questions**: Lectura pública (necesario para la encuesta)
- **respondents**: Inserción pública (registro), lectura por admin
- **responses**: Inserción/upsert pública (el encuestado responde), lectura por admin + por respondent_id propio

## Autenticación

- Login: Supabase Auth con email/password
- Middleware Next.js protege rutas `/admin/*` (excepto `/admin/login`)
- AdminLayout verifica que el email del usuario esté en lista de admins autorizados (`admin@gbm.net`)
- Si usuario no autorizado: muestra "Acceso Denegado"

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
