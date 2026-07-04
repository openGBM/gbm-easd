# Infrastructure Design — Abstracción Arquitectónica v3.1

## Resumen

Este documento cubre la infraestructura para **toda la abstracción** (transversal a todas las units), no solo Unit 1. Unit 1 en sí no requiere infraestructura (es TypeScript puro), pero aquí se define el mapeo completo de servicios actuales vs futuros.

---

## 1. Estado Actual de Infraestructura

```
┌────────────────────────────────────────────────────────────────────┐
│                      VERCEL (Hosting)                              │
│                                                                    │
│  Next.js App → Serverless Functions (API Routes)                   │
│             → Edge Middleware (proxy.ts)                           │
│             → Static + SSR (Pages)                                 │
└──────────────────────────┬─────────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│                      SUPABASE (BaaS)                               │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ PostgreSQL   │  │ GoTrue Auth  │  │ PostgREST (API)          │  │
│  │ (managed)    │  │ (email/pw)   │  │ (auto-generated REST)    │  │
│  │ + RLS        │  │              │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│ UPSTASH Redis        │  │ External AI APIs     │
│ (Rate Limiting)      │  │ Gemini + Groq        │
└──────────────────────┘  └──────────────────────┘
```

---

## 2. Mapeo de Servicios: Supabase → AWS Equivalentes

| Función | Supabase (Actual) | AWS Equivalente | Notas |
|---------|-------------------|-----------------|-------|
| **Base de datos** | PostgreSQL managed | RDS PostgreSQL / Aurora Serverless v2 | RLS se mantiene con RDS Postgres |
| **Auth** | GoTrue (email/pw) | Amazon Cognito | User pools + hosted UI |
| **REST API** | PostgREST (auto) | API Gateway + Lambda / Direct SDK | Sin auto-API, pero con más control |
| **Rate Limiting** | Upstash Redis | API Gateway throttling / WAF | Built-in en API Gateway |
| **AI** | Gemini + Groq APIs | Amazon Bedrock (Claude, Titan) | Single SDK, múltiples modelos |
| **Hosting** | Vercel | Amplify Hosting / CloudFront + S3 + Lambda@Edge | SSR via Lambda |
| **File Storage** | Supabase Storage | S3 | No usado actualmente |
| **Realtime** | Supabase Realtime | AppSync / IoT Core | No usado actualmente |
| **Logs** | Supabase Dashboard | CloudWatch Logs | Centralizado + alertas |
| **Métricas** | N/A (in-memory) | CloudWatch Metrics | Native integration |
| **Secrets** | Env vars (Vercel) | AWS Secrets Manager / Parameter Store | Rotation automática |

---

## 3. Comparación de Costos Detallada

### Escenario: 1000 encuestados/mes, 50 sesiones activas, 10 análisis IA/mes

| Servicio | Supabase (Free/Pro) | AWS (Free Tier) | AWS (Post Free Tier) |
|----------|--------------------:|----------------:|-----------------:|
| Base de datos | $0 (free) / $25 (pro) | $0 (RDS 750h t3.micro) | ~$15/mes (t3.micro) |
| Auth | $0 (incluido) | $0 (Cognito 50K MAUs free) | ~$0.0055/MAU |
| Hosting | $0 (Vercel free) | $0 (Amplify free tier) | ~$5/mes |
| Rate Limiting | $0 (Upstash free) | $0 (API GW incluido) | $0 |
| AI (10 análisis) | ~$0.01 (Gemini free) | ~$0.50 (Bedrock Claude) | ~$0.50 |
| Logs/Métricas | $0 (in-memory) | $0 (5GB free) | ~$3/mes |
| **TOTAL** | **$0 - $25/mes** | **$0 (primer año)** | **~$24/mes** |

### Conclusión de Costos
- Ambas opciones son comparables en costo para el scale actual
- Supabase tiene ventaja en Free Tier perpetuo (no solo 12 meses)
- AWS tiene ventaja en predictibilidad a escala y sin cliffs de pricing
- **Recomendación**: Mantener Supabase hasta que se requiera compliance enterprise o multi-región

---

## 4. Infraestructura de Unit 1 (Específica)

Unit 1 **no requiere infraestructura** — es código TypeScript puro que se ejecuta dentro del runtime existente de Next.js.

| Componente | Infra requerida | Notas |
|------------|----------------|-------|
| Ports (interfaces) | Ninguna | Eliminados en compilación |
| DomainError | Ninguna | Clases JS estándar |
| Result type | Ninguna | Funciones puras |
| Container | Ninguna | In-memory Maps |
| Tokens | Ninguna | Constants |
| DTOs | Ninguna | Solo types |

**Conclusión**: Unit 1 se despliega dentro de la misma infraestructura existente (Vercel + Next.js) sin cambios ni adiciones de infra.

---

## 5. Infraestructura de Observabilidad (Unit 7 — Preview)

La observabilidad se diseña para $0 costo con upgrade path:

| Componente | Implementación $0 | Upgrade Path (futuro) |
|------------|-------------------|----------------------|
| Logging | Pino → stdout (Vercel captura) | → CloudWatch Logs |
| Métricas | In-memory + /api/metrics | → Grafana Cloud free (scrape) → CloudWatch Metrics |
| Tracing | N/A (single service) | → AWS X-Ray / OpenTelemetry |
| Alertas | N/A | → CloudWatch Alarms / Grafana Alerts |
| Dashboards | N/A | → Grafana Cloud free dashboard |

---

## 6. Resiliency Infrastructure Decisions

Respondiendo a los requerimientos de la extensión RESILIENCY:

### RESILIENCY-02: RTO/RPO

| Aspecto | Decisión |
|---------|----------|
| **RTO** | ~1 hora (redeploy desde git) |
| **RPO** | ~24 horas (Supabase daily backups en free tier) |
| **DR Strategy** | Backup & Restore (opción A — lowest cost) |
| **Justificación** | Herramienta interna de diagnóstico, no mission-critical |

### RESILIENCY-03: Change Management

| Aspecto | Decisión |
|---------|----------|
| **Proceso** | GitHub Pull Requests con review requerido |
| **Herramienta** | GitHub (ya configurado en .github/workflows/ci.yml) |
| **Aprobación** | Al menos 1 reviewer antes de merge a main |

### RESILIENCY-04: CI/CD y Rollback

| Aspecto | Decisión |
|---------|----------|
| **Pipeline** | GitHub Actions (ya existente: ci.yml) |
| **Deployment** | Vercel auto-deploy on push to main |
| **Rollback** | Vercel instant rollback (redeploy previous deployment) |
| **Deployment style** | Direct (Vercel manages zero-downtime deploys) |

### RESILIENCY-08: Regional Topology

| Aspecto | Decisión |
|---------|----------|
| **Topología** | Single-region (Vercel auto-selects closest) |
| **Justificación** | Herramienta interna, audiencia regional (México), costo $0 |
| **Multi-zona** | Implícito en Vercel (serverless multi-AZ by default) |

### RESILIENCY-14: Resiliency Testing

| Aspecto | Decisión |
|---------|----------|
| **Approach** | Defer to Operations phase (opción C) |
| **Test scenarios** | Documentados ahora, ejecutados post-deployment |
| **Escenarios** | DB unavailable → graceful error, AI provider down → failover to secondary |

### RESILIENCY-15: Incident Response

| Aspecto | Decisión |
|---------|----------|
| **Proceso** | Lightweight propuesto (opción B) |
| **Detección** | /api/health check + Vercel status |
| **Respuesta** | Notificación manual → diagnóstico → rollback si necesario |
| **Post-mortem** | Documento en aidlc-docs/ con causa raíz y acción correctiva |

---

## 7. Diagramas a Generar (Unit 8)

Se generarán con el power aws-drawio en Unit 8:

1. **arquitectura-abstraccion-actual.drawio** — Estado actual con Supabase directo
2. **arquitectura-abstraccion-objetivo.drawio** — Estado objetivo con Ports & Adapters
3. **comparacion-supabase-aws.drawio** — Mapeo visual lado a lado de servicios equivalentes
