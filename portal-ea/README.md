# Portal de Autodiagnóstico — Arquitectura Empresarial (GBM)

Portal web de autodiagnóstico de madurez de Arquitectura Empresarial para clientes GBM.  
Permite a los encuestados evaluar la eficacia de su grupo de EA en múltiples dimensiones mediante una escala de acuerdo (1–5), visualizar resultados con gráfico de radar, y a los administradores gestionar sesiones de evaluación.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| UI | React 19 + Tailwind CSS 4 |
| Visualización | Recharts (radar chart) |
| QR | qrcode.react |
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
│   │       └── sesiones/[id]/page.tsx       # Detalle de sesión
│   ├── components/
│   │   ├── SurveyForm.tsx                   # Wizard de encuesta (registro + stepper)
│   │   ├── RadarChart.tsx                   # Gráfico de radar (Recharts)
│   │   ├── ResultsTable.tsx                 # Tabla resumen con nivel de madurez
│   │   └── QRCodeDisplay.tsx                # Generador de código QR
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts                    # Cliente Supabase (browser)
│   │       ├── server.ts                    # Cliente Supabase (server)
│   │       └── middleware.ts                # Auth middleware helper
│   ├── middleware.ts                        # Next.js middleware (protege /admin/*)
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
| `respondents` | Encuestados (id, session_id, name, email, completed, created_at) |
| `responses` | Respuestas (id, respondent_id, question_id, value 1-5, created_at) |

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
- Dashboard con lista de sesiones (activas/inactivas)
- Crear nuevas sesiones
- Habilitar/deshabilitar sesiones
- Código QR generado para cada sesión
- Detalle de sesión con lista de encuestados
- Vista de resultados por encuestado individual
- Vista consolidada (promedio de todos los encuestados completados)
- Eliminar encuestados y sus respuestas

### Seguridad
- Middleware Next.js protege rutas `/admin/*`
- Supabase Auth con verificación de email autorizado
- RLS (Row Level Security) en PostgreSQL
- Validación UUID en parámetros de ruta

---

## Niveles de Madurez

| Rango (por dimensión) | Nivel | Color |
|------------------------|-------|-------|
| 6–13 puntos | Naciente | 🔴 Rojo |
| 14–23 puntos | Base | 🟡 Amarillo |
| 24–30 puntos | Clase Mundial | 🟢 Verde |

Cada dimensión tiene 6 preguntas × escala 1–5 = máximo 30 puntos por dimensión.  
El nivel global se calcula sobre la suma total (8 dimensiones × 30 = 240 máximo).

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
```

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

---

## Futuras Mejoras (Fuera de Alcance MVP)

- Despliegue en AWS (producción)
- Comparación histórica entre sesiones
- Exportación PDF de resultados
- Multi-idioma
- Notificaciones por correo al completar encuesta
