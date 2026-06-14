# Portal de Evaluaciones de Autodiagnóstico — GBM

Portal web multi-instrumento para evaluaciones de autodiagnóstico organizacional.  
Permite aplicar distintos instrumentos de evaluación, gestionar sesiones con participantes, visualizar resultados con gráficos de radar, y generar análisis interpretativos con inteligencia artificial.

![Portal de Evaluaciones GBM](../docs/portal-inicio.png)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| UI | React 19 + Tailwind CSS 4 |
| Visualización | Recharts (radar chart, bar chart) |
| QR | qrcode.react |
| Exportación | ExcelJS, jsPDF + html2canvas-pro |
| IA/Análisis | Google Gemini 2.0 Flash + Groq Llama 3.3 70B (fallback) |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Supabase Auth (email/password) |

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
│   │       └── encuestados/page.tsx         # Historial de encuestados
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
| `sessions` | Sesiones de evaluación (id, name, is_active, created_at) |
| `dimensions` | Dimensiones EA con color (id, name, description, display_order, color) |
| `questions` | Preguntas por dimensión (id, dimension_id, text, display_order) |
| `respondents` | Encuestados (id, session_id, name, email, completed, completed_at, created_at) |
| `responses` | Respuestas (id, respondent_id, question_id, value 1-5, created_at) |
| `session_analyses` | Análisis IA por sesión (id, session_id, analysis_text, generated_at, generated_by) |

---

## Funcionalidades Implementadas

### Encuestado
- Acceso público por enlace `/encuesta/{sessionId}` (sin login)
- Registro con nombre y correo electrónico
- Encuesta tipo wizard/stepper: una dimensión por paso
- Escala de acuerdo (1–5): Totalmente en desacuerdo → Totalmente de acuerdo
- Barra de progreso con color por dimensión
- Navegación adelante/atrás entre dimensiones
- Validación de respuestas completas antes de avanzar
- Reanudación si el encuestado ya se registró pero no completó
- Gráfico de radar con resultados al finalizar
- Tabla resumen con nivel de madurez por dimensión (Naciente / Base / Clase Mundial)

### Administrador
- Login con email/password (Supabase Auth)
- Dashboard con métricas globales (sesiones activas, respuestas totales, tiempo promedio)
- Dashboard con lista de sesiones (activas/inactivas)
- Crear nuevas sesiones
- Habilitar/deshabilitar sesiones
- Eliminar sesiones con confirmación (cascade)
- Código QR generado para cada sesión con botones para copiar URL y copiar QR como imagen PNG
- Detalle de sesión con dashboard específico (respuestas y tiempo promedio de la sesión)
- Vista de resultados por encuestado individual
- Vista consolidada (promedio de todos los encuestados completados)
- Análisis IA (Gemini/Groq): interpretación ejecutiva de resultados bajo demanda, con formato markdown y opción de copiar
- Prompt de expertise IA con vista previa markdown (expand/collapse), textarea ampliado (12 rows, monospace) y límite de 6000 caracteres
- Prompts personalizados (>200 chars) usan su propio formato de respuesta en lugar de la plantilla genérica
- Detalle por pregunta enviado a la IA cuando el instrumento tiene prompt personalizado
- Editor visual de dimensiones: color editable vía color picker, descripción editable inline
- Versionamiento automático al agregar/eliminar dimensiones (si ya existen respuestas)
- Exportar respuestas a Excel (.xlsx) con 2 hojas: Resumen y Detalle
- Exportar resultados a PDF (radar + tabla con título del instrumento)
- Eliminar encuestados y sus respuestas
- Tendencias por instrumento: gráfico de barras con evolución entre sesiones + filtros
- Historial de encuestados: búsqueda por email/nombre + tabla cronológica + radares por sesión
- Metadata dinámica en URLs de encuesta: OG tags muestran nombre del instrumento y sesión

### Seguridad
- Supabase Auth con verificación de email autorizado
- RLS (Row Level Security) en PostgreSQL
- Validación UUID en parámetros de ruta
- Exportación Excel restringida a administradores autenticados

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
- Node.js 18+
- Supabase CLI (para base de datos local)
- Proyecto Supabase configurado con tablas y seed data

### Variables de entorno

Crear archivo `.env.local` en la raíz de `portal-ea/`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
ADMIN_EMAILS=admin@gbm.net
GEMINI_API_KEY=<tu-api-key-de-google-ai-studio>
GROQ_API_KEY=<tu-api-key-de-groq>
```

> **Nota:** Se requiere al menos una de las dos keys de IA (GEMINI o GROQ). El sistema intenta Gemini primero y usa Groq como fallback.

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
| `/admin/login` | Público | Login de administrador |
| `/admin` | Protegido | Dashboard de sesiones |
| `/admin/sesiones/[id]` | Protegido | Detalle de sesión |
| `/admin/instrumentos` | Protegido | Catálogo de instrumentos |
| `/admin/instrumentos/[id]` | Protegido | Gestión de instrumento |
| `/admin/instrumentos/[id]/tendencias` | Protegido | Tendencias del instrumento |
| `/admin/encuestados` | Protegido | Historial de encuestados |

---

## API Routes

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/analysis` | POST | Genera análisis IA con Gemini (solo admin) |

---

## Roadmap

### Corto plazo (próxima iteración)

- **Administración de usuarios y roles** — Gestión de usuarios desde el panel (crear, editar, desactivar). Roles: admin (gestión completa), editor (instrumentos y sesiones), viewer (solo lectura de resultados y análisis).
- **Notificaciones por correo** — Admin recibe aviso al completar un encuestado; encuestado recibe enlace a sus resultados.
- **Exportar análisis IA a PDF** — Descargar el análisis interpretativo como PDF con branding GBM para entregar al cliente.

### Mediano plazo

- **Landing page del instrumento** — Página intermedia con nombre, descripción e instrucciones antes de comenzar la evaluación.
- **Tipos de pregunta variados** (texto libre, boolean, selección múltiple) — Capturar contexto cualitativo además del Likert 1-5.
- **SSO** (SAML, OAuth corporativo) — Login empresarial para clientes grandes.

### Largo plazo (postergado)

- Multi-idioma (inglés, portugués)
- Multi-tenant (organizaciones aisladas con datos separados)
