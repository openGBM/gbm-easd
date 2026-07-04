# Deployment Architecture — Abstracción Arquitectónica v3.1

## Resumen

La arquitectura de deployment **no cambia** con la introducción de la capa de abstracción. El sistema sigue siendo un monolito Next.js desplegado en Vercel. La diferencia es la organización interna del código.

---

## 1. Arquitectura de Deployment Actual (se mantiene)

```
┌────────────────────────────────────────────────────────────────────────┐
│                           INTERNET                                     │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                               │
│                                                                        │
│  ┌────────────────┐  ┌────────────────────────┐  ┌──────────────────┐  │
│  │Edge Middleware │  │ Serverless Functions   │  │ Static Assets    │  │
│  │ (proxy.ts)     │  │ (API Routes + SSR)     │  │ (JS/CSS/Images)  │  │
│  │                │  │                        │  │                  │  │
│  │ Auth check     │  │ /api/respondents       │  │ /_next/static    │  │
│  │ Route protect  │  │ /api/analysis          │  │ /public          │  │
│  │                │  │ /api/viewer-link       │  │                  │  │
│  │                │  │ /api/metrics (nuevo)   │  │                  │  │
│  │                │  │ /api/health (nuevo)    │  │                  │  │
│  └────────────────┘  └────────────────────────┘  └──────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
         │                        │
         │                        │ HTTPS (supabase-js SDK)
         ▼                        ▼
┌──────────────────┐    ┌────────────────────────────────────────────────┐
│ Upstash Redis    │    │              SUPABASE                          │
│ (Rate Limit)     │    │                                                │
│                  │    │  PostgreSQL + GoTrue Auth + PostgREST          │
└──────────────────┘    └────────────────────────────────────────────────┘
         │
         └──── (No cambia — Upstash no se abstrae en esta iteración)
```

---

## 2. Cambios en Deployment por la Abstracción

| Aspecto | Antes | Después | Impacto en Deployment |
|---------|-------|---------|----------------------|
| Código fuente | `lib/supabase/*` + inline queries | `core/` + `lib/supabase/*` eliminado | Solo organización de archivos |
| Bundle size | X KB | X + ~5KB (Container + errors) | Negligible |
| Cold start | Y ms | Y + ~1ms (Container init) | Imperceptible |
| Env vars | 5 vars | 5 vars + `PROVIDER=supabase` + `AI_PROVIDERS=gemini,groq` | 2 env vars nuevas |
| API endpoints | /api/respondents, /api/analysis, /api/viewer-link | + /api/metrics, /api/health | 2 endpoints nuevos |
| Dependencias npm | N packages | N + pino + pino-pretty(dev) + fast-check(dev) | 1 runtime dep nueva |

---

## 3. Variables de Entorno (Post-Refactor)

### Existentes (sin cambio)

| Variable | Contexto | Uso |
|----------|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Anon key para RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin operations bypass RLS |
| `ADMIN_EMAILS` | Server only | Lista de admins autorizados |
| `GEMINI_API_KEY` | Server only | Google Gemini API |
| `GROQ_API_KEY` | Server only | Groq API |
| `UPSTASH_REDIS_REST_URL` | Server only | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Server only | Rate limiting auth |

### Nuevas (post-refactor)

| Variable | Contexto | Default | Uso |
|----------|----------|---------|-----|
| `PROVIDER` | Server + Client | `supabase` | Selecciona el set de adapters (supabase/aws) |
| `AI_PROVIDERS` | Server only | `gemini,groq` | Orden de failover de AI providers |
| `LOG_LEVEL` | Server only | `info` | Nivel mínimo de logging (debug/info/warn/error) |
| `NODE_ENV` | Auto (Vercel) | — | Determina formato de logs (pretty vs JSON) |

---

## 4. Arquitectura AWS Futura (Referencia)

Cuando se decida migrar a AWS, la arquitectura de deployment cambiaría a:

```
┌────────────────────────────────────────────────────────────────────────┐
│                           INTERNET                                      │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      AWS AMPLIFY / CLOUDFRONT                           │
│                                                                          │
│  ┌────────────────┐  ┌────────────────────────┐  ┌──────────────────┐  │
│  │ CloudFront     │  │ Lambda@Edge / SSR       │  │ S3 Static        │  │
│  │ (CDN + WAF)    │  │ (API Routes + SSR)      │  │ (Assets)         │  │
│  └────────────────┘  └────────────────────────┘  └──────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
         │                        │
         │ API Gateway            │
         ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│ Amazon Cognito   │    │ RDS PostgreSQL   │    │ Amazon Bedrock       │
│ (Auth)           │    │ (Data)           │    │ (AI)                 │
└──────────────────┘    └──────────────────┘    └──────────────────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────────┐
                                               │ CloudWatch           │
                                               │ (Logs + Metrics)     │
                                               └──────────────────────┘
```

**Switch**: Cambiar `PROVIDER=aws` + configurar env vars AWS. El código de aplicación no cambia.

---

## 5. Estrategia de Deployment por Unit

| Unit | Deployment Impact | Requiere Downtime |
|------|-------------------|-------------------|
| 1 - Core Foundation | Solo agrega archivos, no cambia runtime | ❌ |
| 2 - Supabase Adapters | Solo agrega archivos, no cambia runtime | ❌ |
| 3 - Server Migration | Cambia imports internos, misma funcionalidad | ❌ |
| 4 - Client Migration | Cambia imports internos, misma funcionalidad | ❌ |
| 5 - Auth Abstraction | Cambia middleware — zero-downtime via Vercel | ❌ |
| 6 - AI Abstraction | Cambia 1 API route — zero-downtime | ❌ |
| 7 - Observability | Agrega 2 endpoints nuevos + logging | ❌ |
| 8 - AWS Stubs | Solo test files + docs — no afecta runtime | ❌ |

**Todas las units se despliegan sin downtime** gracias a Vercel's atomic deployments.

---

## 6. Security Infrastructure (SECURITY extension)

| Regla | Infraestructura | Estado |
|-------|----------------|--------|
| SECURITY-01 (Encryption) | Supabase: TLS + encryption at rest (default) | ✅ Sin cambio |
| SECURITY-02 (Access logs) | Vercel: request logs automáticos | ✅ Sin cambio |
| SECURITY-04 (Headers) | next.config.ts: headers configurados | ✅ Sin cambio |
| SECURITY-07 (Network) | Vercel + Supabase: managed networking | ✅ Sin cambio |
| SECURITY-10 (Supply chain) | package-lock.json + npm audit en CI | ✅ Sin cambio |
| SECURITY-14 (Alerting) | /api/health nuevo + Vercel status | ✅ Mejora con Unit 7 |

---

## 7. Resumen

La capa de abstracción **no requiere cambios de infraestructura**. Todo se despliega en la misma plataforma existente (Vercel + Supabase) con:
- 2 variables de entorno nuevas
- 2 API endpoints nuevos (/api/metrics, /api/health)
- 1 dependencia runtime nueva (pino)
- Zero downtime en todas las fases
