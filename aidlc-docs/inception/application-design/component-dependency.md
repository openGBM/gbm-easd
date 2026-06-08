# Dependencias entre Componentes

## Matriz de Dependencias

| Componente | Depende de |
|------------|-----------|
| SurveyPage | SessionService, RespondentService, ResponseService, DimensionService |
| ResultsPage | ResponseService, DimensionService, RadarChart |
| AdminLayout | AuthService |
| AdminDashboard | SessionService, QRCodeDisplay |
| AdminSessionDetail | RespondentService, ResponseService, RadarChart |
| LoginPage | AuthService |
| RadarChart | (sin dependencias de servicio — solo Recharts) |
| QRCodeDisplay | (sin dependencias — solo qrcode library) |

## Flujo de Datos

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │SurveyPage│    │ResultsPage│   │  AdminPages  │  │
│  └────┬─────┘    └─────┬────┘    └──────┬───────┘  │
│       │                │                 │          │
│       v                v                 v          │
│  ┌─────────────────────────────────────────────┐   │
│  │           Services Layer (lib/)             │   │
│  │  SessionService | RespondentService |       │   │
│  │  ResponseService | DimensionService |       │   │
│  │  AuthService                                │   │
│  └─────────────────────┬───────────────────────┘   │
│                         │                           │
└─────────────────────────┼───────────────────────────┘
                          │
                          v
┌─────────────────────────────────────────────────────┐
│                   SUPABASE                          │
│                                                     │
│  ┌──────────┐  ┌────────────┐  ┌───────────────┐  │
│  │PostgreSQL │  │    Auth    │  │     RLS       │  │
│  │  Tables   │  │  Service   │  │   Policies    │  │
│  └──────────┘  └────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Rutas de la Aplicación (Next.js App Router)

```
/                          → Landing/redirect
/encuesta/[sessionId]      → SurveyPage (pública)
/resultados/[respondentId] → ResultsPage (pública)
/admin/login               → LoginPage
/admin                     → AdminDashboard (protegida)
/admin/sesiones/[id]       → AdminSessionDetail (protegida)
```

## Comunicación

- **Frontend → Supabase**: Via Supabase Client SDK (@supabase/supabase-js)
- **Auth**: Supabase Auth con cookies/session en Next.js middleware
- **RLS**: Row Level Security en PostgreSQL para proteger datos
- **No API custom necesaria**: Supabase expone REST automáticamente
