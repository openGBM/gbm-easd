# Requerimientos — Abstracción Arquitectónica v3.1

## Análisis de Intención

| Campo | Valor |
|-------|-------|
| **Solicitud del usuario** | Introducir capas de abstracción para desacoplar Supabase y facilitar migración a AWS |
| **Tipo de solicitud** | Refactoring arquitectónico + Migración preparatoria |
| **Alcance estimado** | System-wide (15+ archivos, 3 capas: DB, Auth, Observabilidad) |
| **Complejidad estimada** | Compleja — múltiples patrones de diseño, testing, observabilidad, sin romper funcionalidad |

---

## Decisiones Clave (de las respuestas del usuario)

| Decisión | Respuesta | Implicación |
|----------|-----------|-------------|
| Alcance de abstracción | DB + Auth + AI (B + extensión) | Repository Pattern + Auth Provider Interface + AI Provider Interface |
| Target de migración | AWS nativo (A) | DynamoDB/RDS + Cognito como target validador |
| Estrategia de fases | Branch by Abstraction (B) | Capa completa primero, switch progresivo |
| Observabilidad | Intermedio (B) | Logging estructurado + métricas de rendimiento |
| Presupuesto | $0 adicional (A) | Solo open-source: Pino, OpenTelemetry SDK, métricas en console |
| Comparación infra | Supabase vs AWS nativo (A) | Documento formal de comparación |
| Impacto en funcionalidad | UX sin cambios (B) | Refactoring interno, contratos visuales intactos |
| Testing | Unitarios + Contratos + E2E (D) | Máxima cobertura para validar la abstracción |
| Documentación | ADR + integrado en diseño (D) | Un ADR por decisión + resumen en Application Design |
| Seguridad | Sí, bloqueante (A) | Todas las reglas SECURITY aplican |
| Resiliencia | Sí, bloqueante (A) | Todas las reglas RESILIENCY aplican |
| PBT | Sí, full (A) | Todas las reglas PBT aplican (adapter correctness, serialización) |

---

## Requerimientos Funcionales

### RF-ABS-01: Capa de Repositorio (Repository Pattern)

**Descripción**: Abstraer todas las operaciones de datos detrás de interfaces TypeScript que definan contratos de acceso a datos sin acoplar al proveedor.

**Criterios de Aceptación**:
- Interfaces definidas para cada dominio: `SessionRepository`, `RespondentRepository`, `ResponseRepository`, `DimensionRepository`, `QuestionRepository`, `InstrumentRepository`, `ProfileRepository`, `TenantRepository`, `ViewerLinkRepository`, `UsageLogRepository`, `AnalysisRepository`
- Cada interfaz define métodos CRUD + queries específicas del dominio
- Implementación `SupabaseXxxRepository` que encapsula las llamadas actuales a `supabase.from()`
- Ningún componente, página o API route importa directamente `@supabase/supabase-js` o `@supabase/ssr` — solo importan interfaces de repositorio
- Factory/DI container que resuelve la implementación correcta según configuración de entorno

### RF-ABS-02: Capa de Autenticación Abstracta (Auth Provider Interface)

**Descripción**: Abstraer la autenticación detrás de una interfaz que permita swappear Supabase Auth por Cognito u otro proveedor.

**Criterios de Aceptación**:
- Interface `AuthProvider` con métodos: `signIn(email, password)`, `signOut()`, `getUser()`, `refreshSession()`, `onAuthStateChange(callback)`
- Interface `AuthGuard` con: `isAuthenticated()`, `hasRole(role)`, `getCurrentProfile()`
- Implementación `SupabaseAuthProvider` que encapsula la lógica actual
- El middleware de Next.js usa `AuthProvider` sin referencia directa a Supabase
- Los componentes client-side usan hooks que consumen `AuthProvider`

### RF-ABS-03: Inyección de Dependencias / Service Locator

**Descripción**: Sistema de resolución de dependencias que permita cambiar implementaciones sin tocar código de negocio.

**Criterios de Aceptación**:
- Registry central configurable por entorno (`PROVIDER=supabase` | `PROVIDER=aws`, `AI_PROVIDERS=gemini,groq`)
- Resolución type-safe de repositorios, auth providers, y AI providers
- Soporte para scoped instances (per-request en server-side, singleton en client-side)
- Cero dependencias externas de DI framework (implementación ligera propia)

### RF-ABS-04: Implementación por Fases (Branch by Abstraction)

**Descripción**: La migración se ejecuta sin romper funcionalidad, con capacidad de rollback por componente.

**Criterios de Aceptación**:
- **Fase 1**: Crear interfaces + implementaciones Supabase (sin cambios funcionales)
- **Fase 2**: Migrar páginas server-side a usar repositorios (validar con E2E)
- **Fase 3**: Migrar componentes client-side a usar repositorios (validar con E2E)
- **Fase 4**: Migrar auth a `AuthProvider` (validar con E2E)
- **Fase 5**: Crear implementaciones AWS stub/skeleton (validar con contract tests)
- Cada fase es desplegable independientemente
- Rollback = revertir a la fase anterior sin pérdida de datos

### RF-ABS-05: Capa de Abstracción de IA (AI Provider Interface)

**Descripción**: Abstraer los proveedores de IA (Gemini, Groq) detrás de una interfaz que permita swappear por Bedrock u otro proveedor, incluyendo lógica de failover.

**Criterios de Aceptación**:
- Interface `AIProvider` con métodos: `generateCompletion(prompt, options)`, `isAvailable()`, `getModelInfo()`
- Interface `AIProviderChain` con failover configurable: intenta Provider A, si falla intenta Provider B
- Implementaciones: `GeminiProvider`, `GroqProvider` (encapsulan código actual de `/api/analysis/route.ts`)
- Implementación futura: `BedrockProvider` (stub/skeleton)
- La lógica de prompt sanitization y response parsing se mantiene en la capa de servicio, no en los adapters
- El API route `/api/analysis` consume `AIProviderChain` sin referencia directa a SDKs de Gemini/Groq
- Configuración de providers y orden de failover vía variables de entorno (`AI_PROVIDERS=gemini,groq`)
- Métricas por provider: latencia, tokens consumidos, tasa de error, fallbacks ejecutados

### RF-ABS-06: Observabilidad Integrada en la Capa de Abstracción

**Descripción**: Cada operación que pasa por la capa de repositorio/auth debe emitir logs estructurados y métricas de rendimiento.

**Criterios de Aceptación**:
- Logger estructurado (Pino o equivalente zero-cost) con: timestamp, operación, duración_ms, éxito/error, contexto
- Métricas por operación: latencia (p50, p95, p99), tasa de errores, throughput
- Decorator/wrapper pattern que instrumenta automáticamente cada método del repositorio
- Las métricas se almacenan en memoria y se exponen vía endpoint `/api/metrics` (formato Prometheus-compatible) — sin costo externo
- En modo desarrollo: logs a console con colores. En producción: logs JSON estructurados
- Correlación de request-id a través de toda la cadena (middleware → repository → response)

---

## Requerimientos No Funcionales

### RNF-ABS-01: Zero Overhead en Producción

- La capa de abstracción no debe agregar más de 5ms de latencia por operación
- El bundle size del cliente no debe incrementar más de 10KB gzipped
- No se introduce ningún servicio pagado adicional

### RNF-ABS-02: Type Safety Completa

- Todas las interfaces deben ser genéricas y type-safe
- Los tipos de retorno deben ser exactos (no `any`)
- Errores tipados con discriminated unions (no excepciones genéricas)
- Compatible con `strict: true` de TypeScript

### RNF-ABS-03: Testing de la Abstracción

- **Unit tests**: Cada adapter/repository tiene tests unitarios con mocks
- **Contract tests**: Interfaces verificadas con tests que corren contra cualquier implementación
- **Property-Based Tests**: Round-trip de serialización, invariantes de CRUD, idempotencia de upsert
- **E2E tests**: Los Playwright existentes siguen pasando sin modificación
- **Framework PBT**: fast-check (integrado con Vitest existente)

### RNF-ABS-04: Compatibilidad con RLS de Supabase

- La implementación Supabase debe mantener RLS activo
- Los repositorios server-side usan el service_role solo cuando es necesario (operaciones admin)
- Los repositorios client-side respetan el contexto de usuario autenticado

### RNF-ABS-05: Documentación de Decisiones

- Un ADR por cada decisión arquitectónica significativa
- Formato: Título, Contexto, Decisión, Consecuencias, Alternativas consideradas
- ADRs almacenados en `aidlc-docs/construction/portal-ea/adrs/`
- Resumen integrado en el Application Design
- **Diagramas de arquitectura**: Generar diagramas `.drawio` usando el power aws-drawio que documenten:
  - Arquitectura actual (Supabase-coupled)
  - Arquitectura objetivo (capas de abstracción con ports/adapters)
  - Flujo de datos a través de la capa de abstracción
  - Comparación visual Supabase vs AWS (componentes equivalentes)
- Diagramas almacenados en `docs/` junto a los existentes

### RNF-ABS-06: Seguridad (SECURITY extension — bloqueante)

- SECURITY-01: Encryption at rest/transit — mantener TLS y encryption de Supabase/AWS
- SECURITY-03: Logging estructurado sin PII ni secrets en logs
- SECURITY-05: Input validation en todos los repositorios (Zod schemas preservados)
- SECURITY-06: Least-privilege en las policies de la capa de abstracción
- SECURITY-08: Access control mantenido en la nueva capa de auth
- SECURITY-11: Separación de concerns — auth/authz aislados en módulos dedicados
- SECURITY-12: Credentials en secrets manager, no hardcoded
- SECURITY-15: Exception handling fail-closed en todos los adapters

### RNF-ABS-07: Resiliencia (RESILIENCY extension — bloqueante)

- RESILIENCY-05: Logging + métricas + (traces N/A por ser single-service)
- RESILIENCY-06: Health check endpoint que verifica conectividad a DB + Auth
- RESILIENCY-10: Timeouts explícitos en todas las operaciones externas, graceful degradation documentado
- RESILIENCY-01: Clasificación de criticidad de componentes documentada

### RNF-ABS-08: Property-Based Testing (PBT extension — bloqueante)

- PBT-01: Identificar propiedades testables durante el diseño funcional
- PBT-02: Round-trip tests para serialización de/hacia DB
- PBT-03: Invariant tests para transformaciones de datos
- PBT-04: Idempotency tests para operaciones upsert
- PBT-07: Generators de dominio (Session, Respondent, Response, etc.)
- PBT-09: Framework = fast-check (ya en el ecosistema Vitest)

---

## Comparación de Infraestructura: Supabase vs AWS Nativo

### Supabase (Actual)

| Aspecto | Detalle |
|---------|---------|
| **Base de datos** | PostgreSQL managed (Supabase-hosted) |
| **Auth** | Supabase Auth (email/password, GoTrue) |
| **RLS** | Row Level Security nativa en PostgreSQL |
| **Rate Limiting** | Upstash Redis (externo) |
| **AI** | Gemini + Groq (APIs externas) |
| **Hosting** | Vercel (Next.js) |
| **Costo mensual** | ~$0 (free tier Supabase + Vercel) |
| **Vendor lock-in** | Alto — llamadas directas a SDK |
| **Escalabilidad** | Limitada por plan Supabase |
| **Observabilidad** | Básica (Supabase dashboard) |

### AWS Nativo (Target)

| Aspecto | Detalle |
|---------|---------|
| **Base de datos** | RDS PostgreSQL o DynamoDB |
| **Auth** | Amazon Cognito |
| **RLS** | IAM policies + application-level en DynamoDB, o RLS en RDS Postgres |
| **Rate Limiting** | API Gateway throttling o WAF |
| **AI** | Amazon Bedrock |
| **Hosting** | Amplify, ECS, o Lambda@Edge |
| **Costo mensual** | ~$0-25 (Free Tier primer año), ~$50-100 post-free-tier |
| **Vendor lock-in** | Medio-alto (AWS services) pero mayor ecosistema |
| **Escalabilidad** | Muy alta (auto-scaling nativo) |
| **Observabilidad** | CloudWatch + X-Ray integrados |

### Comparación Dimensional

| Dimensión | Supabase | AWS Nativo | Ganador |
|-----------|----------|-----------|---------|
| Costo inicial | $0 | $0 (free tier) | Empate |
| Costo a escala | $25-300/mes | $50-500/mes | Supabase (menor) |
| Time-to-market | Rápido | Medio | Supabase |
| Flexibilidad | Media | Alta | AWS |
| Ecosistema enterprise | Limitado | Completo | AWS |
| Observabilidad nativa | Básica | Avanzada (CloudWatch) | AWS |
| Multi-región | Plan Pro ($) | Nativo | AWS |
| Compliance/Certificaciones | SOC2 | SOC2, HIPAA, PCI, FedRAMP | AWS |
| Developer Experience | Excelente | Buena | Supabase |
| Lock-in con abstracción | Bajo (post-refactor) | Bajo (post-refactor) | Empate |

### Recomendación

**Mantener Supabase como proveedor actual** pero con la capa de abstracción que habilite una migración futura a AWS cuando:
- Se requiera compliance enterprise (HIPAA, PCI)
- Se necesite multi-región activo
- El volumen supere los límites del free tier de Supabase
- El equipo necesite integración con servicios AWS existentes (Bedrock, S3, etc.)

---

## Estructura de Archivos Propuesta (Post-Refactor)

```
src/
├── core/                           # 🆕 Capa de abstracción
│   ├── ports/                      # Interfaces (contratos)
│   │   ├── repositories/
│   │   │   ├── session.repository.ts
│   │   │   ├── respondent.repository.ts
│   │   │   ├── response.repository.ts
│   │   │   ├── dimension.repository.ts
│   │   │   ├── question.repository.ts
│   │   │   ├── instrument.repository.ts
│   │   │   ├── profile.repository.ts
│   │   │   ├── tenant.repository.ts
│   │   │   ├── viewer-link.repository.ts
│   │   │   ├── usage-log.repository.ts
│   │   │   └── analysis.repository.ts
│   │   ├── auth/
│   │   │   ├── auth-provider.ts
│   │   │   └── auth-guard.ts
│   │   ├── ai/
│   │   │   ├── ai-provider.ts
│   │   │   └── ai-provider-chain.ts
│   │   └── observability/
│   │       ├── logger.ts
│   │       └── metrics.ts
│   ├── adapters/                   # Implementaciones concretas
│   │   ├── supabase/              # Implementación actual
│   │   │   ├── repositories/
│   │   │   ├── auth/
│   │   │   └── index.ts
│   │   ├── ai/                    # Implementaciones AI
│   │   │   ├── gemini-provider.ts
│   │   │   ├── groq-provider.ts
│   │   │   └── index.ts
│   │   └── aws/                   # 🔮 Futura implementación
│   │       ├── repositories/
│   │       ├── auth/
│   │       ├── bedrock-provider.ts
│   │       └── index.ts
│   ├── observability/             # Instrumentación
│   │   ├── instrumented-repository.ts  # Decorator
│   │   ├── pino-logger.ts
│   │   └── metrics-collector.ts
│   ├── errors/                    # Error types
│   │   └── domain-errors.ts
│   └── container.ts              # DI / Service Locator
├── app/                           # (sin cambios en estructura)
├── components/                    # (sin cambios en estructura)
├── lib/                           # Helpers existentes (se reducen)
└── types/                         # (sin cambios)
```

---

## Plan de Fases de Alto Nivel

| Fase | Descripción | Riesgo | Validación |
|------|-------------|--------|------------|
| **1** | Crear `core/ports/` + `core/errors/` + `core/types/` + containers | Nulo | tsc --noEmit |
| **2** | Crear `core/adapters/supabase/` (repos + client-factory) | Bajo | Unit tests + Contract tests |
| **3** | Migrar API routes server-side a usar Container | Medio | E2E Playwright |
| **3.5** | Crear `core/services/` (Application Services / Use Cases) | Bajo | Unit tests con repos mockeados |
| **4** | Crear ClientContainer + hooks para client components | Bajo | tsc --noEmit |
| **4.5** | Migrar pages/components reales usando services + repos | Medio | E2E Playwright |
| **5** | Migrar auth a `AuthProvider` abstracto | Alto | E2E + Auth flow manual |
| **5.5** | Migrar AI a `AIProvider` + `AIProviderChain` (Gemini/Groq) | Bajo | Unit tests + E2E analysis flow |
| **6** | Agregar observabilidad (decorator + logger + metrics endpoint) | Bajo | Unit tests |
| **7** | Crear `core/adapters/aws/` (stubs + contract tests) | Bajo | Contract tests |
| **8** | Generar diagramas de arquitectura (.drawio) — actual, objetivo, comparación | Nulo | Visual review |

**Nota sobre RF-ABS-01**: El criterio "Ningún componente/página/API route importa directamente @supabase" es un **criterio de completion final** (post-Fase 4.5). Durante la implementación progresiva, coexisten archivos migrados y no migrados.

---

## Restricciones Absolutas

1. **NUNCA desactivar RLS** como solución a problemas de permisos durante el refactoring
2. **NUNCA exponer API keys** en la capa de abstracción (solo variables de entorno server-side)
3. **NUNCA romper E2E tests** — cada fase debe mantener todos los tests pasando
4. **$0 de costo adicional** en herramientas de observabilidad o infraestructura
5. **No cambiar la UX** — el refactoring es 100% interno
