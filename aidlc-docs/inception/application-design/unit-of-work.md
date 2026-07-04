# Unidades de Trabajo — Abstracción Arquitectónica v3.1

## Estrategia de Descomposición

Cada unidad de trabajo (unit) es un **incremento desplegable independientemente** que:
- Puede ir a producción sin romper funcionalidad existente
- Tiene sus propios tests que validan el incremento
- No requiere que las unidades posteriores estén completas para funcionar
- Sigue el principio de "expand-then-contract" (primero se agrega lo nuevo, luego se elimina lo viejo)

**Modelo de deployment**: Monolito modular (Next.js App Router) — todas las units se despliegan como una sola aplicación pero con boundaries claros de módulos.

---

## Unidades de Trabajo

### Unit 1: Core Foundation (Interfaces + Errors + Container)

| Aspecto | Detalle |
|---------|---------|
| **ID** | `unit-core-foundation` |
| **Propósito** | Establecer las interfaces, tipos de error, Result type, y el Container de DI |
| **Archivos nuevos** | ~25 (ports/*, errors/*, types/tokens.ts, server-container.ts, client-container.ts) |
| **Archivos modificados** | 0 |
| **Riesgo** | Nulo — solo agrega código nuevo, no toca existente |
| **Desplegable** | ✅ No cambia nada en runtime, es código inerte |
| **Tests** | tsc --noEmit (compila), unit tests del Container |
| **Dependencias** | Ninguna unit previa |

**Entregables:**
- `core/ports/repositories/*.ts` — 11 interfaces de repositorio
- `core/ports/auth/*.ts` — 3 interfaces de autenticación
- `core/ports/ai/*.ts` — 2 interfaces de AI
- `core/ports/observability/*.ts` — 2 interfaces de observabilidad
- `core/errors/domain-errors.ts` — DomainError + subclases
- `core/errors/result.ts` — Result<T, E> type
- `core/types/tokens.ts` — ServiceToken definitions
- `core/types/dtos.ts` — CreateXxxDTO, UpdateXxxDTO
- `core/server-container.ts` — ServerContainer skeleton
- `core/client-container.ts` — ClientContainer skeleton

---

### Unit 2: Supabase Adapters (Repository Implementations)

| Aspecto | Detalle |
|---------|---------|
| **ID** | `unit-supabase-adapters` |
| **Propósito** | Implementar todas las interfaces de repositorio con Supabase, encapsulando el código actual |
| **Archivos nuevos** | ~14 (adapters/supabase/repositories/*, client-factory.ts) |
| **Archivos modificados** | 0 |
| **Riesgo** | Bajo — solo agrega implementaciones, no toca consumidores |
| **Desplegable** | ✅ Código inerte hasta que los consumidores lo usen |
| **Tests** | Unit tests (mocked Supabase) + Contract tests |
| **Dependencias** | Unit 1 (interfaces y tipos) |

**Entregables:**
- `core/adapters/supabase/repositories/*.ts` — 11 implementaciones
- `core/adapters/supabase/client-factory.ts` — Factories para browser/server/admin clients
- `core/adapters/supabase/index.ts` — Barrel export
- Contract tests verificando que cada adapter cumple su interfaz

---

### Unit 3: Server-Side Migration

| Aspecto | Detalle |
|---------|---------|
| **ID** | `unit-server-migration` |
| **Propósito** | Migrar todas las páginas server-side y API routes para usar repositorios vía Container |
| **Archivos nuevos** | 0 |
| **Archivos modificados** | ~8 (server pages + API routes) |
| **Riesgo** | Medio — cambia código en producción (pero misma lógica, solo indirección) |
| **Desplegable** | ✅ Funcionalidad idéntica, solo cambia de dónde viene la data |
| **Tests** | E2E Playwright (deben pasar sin modificación) |
| **Dependencias** | Unit 1 + Unit 2 |

**Archivos a migrar:**
- `app/encuesta/[sessionId]/page.tsx` — createServerSupabaseClient → Container
- `app/resultados/[respondentId]/page.tsx` — idem
- `app/api/respondents/route.ts` — idem
- `app/api/analysis/route.ts` — parcial (DB queries, AI se migra en Unit 6)
- `app/api/viewer-link/route.ts` — idem
- `app/admin/instrumentos/[id]/tendencias/page.tsx` — idem
- `app/admin/encuestados/page.tsx` — idem
- Otros API routes con server-side queries

---

### Unit 4: Client-Side Migration

| Aspecto | Detalle |
|---------|---------|
| **ID** | `unit-client-migration` |
| **Propósito** | Migrar todos los componentes client-side para usar repositorios vía ClientContainer |
| **Archivos nuevos** | 0 |
| **Archivos modificados** | ~5 (client components + pages 'use client') |
| **Riesgo** | Medio — cambia código que corre en el browser |
| **Desplegable** | ✅ Funcionalidad idéntica |
| **Tests** | E2E Playwright |
| **Dependencias** | Unit 1 + Unit 2 |

**Archivos a migrar:**
- `app/admin/page.tsx` (AdminDashboard) — createClient() → ClientContainer
- `app/admin/sesiones/[id]/page.tsx` — idem
- `components/SurveyForm.tsx` — idem
- `app/admin/login/page.tsx` — idem
- `app/admin/usuarios/page.tsx` — idem

---

### Unit 5: Auth Abstraction

| Aspecto | Detalle |
|---------|---------|
| **ID** | `unit-auth-abstraction` |
| **Propósito** | Migrar autenticación a AuthProvider abstracto (Supabase Auth → interfaz) |
| **Archivos nuevos** | ~4 (adapters/supabase/auth/*) |
| **Archivos modificados** | ~4 (proxy.ts, login page, AdminNav, auth-guard helper) |
| **Riesgo** | Alto — toca el flujo de autenticación |
| **Desplegable** | ✅ Misma funcionalidad con Supabase Auth detrás |
| **Tests** | E2E Playwright (login flow) + unit tests AuthProvider |
| **Dependencias** | Unit 1 + Unit 3 (middleware ya usa Container) |

**Entregables:**
- `core/adapters/supabase/auth/supabase-auth-provider.ts`
- `core/adapters/supabase/auth/supabase-auth-guard.ts`
- `core/adapters/supabase/auth/supabase-auth-middleware.ts`
- Migrar `proxy.ts` para usar AuthMiddleware del Container
- Migrar login page y AdminNav para usar AuthProvider del Container

---

### Unit 6: AI Abstraction

| Aspecto | Detalle |
|---------|---------|
| **ID** | `unit-ai-abstraction` |
| **Propósito** | Migrar proveedores de IA a AIProvider + AIProviderChain con failover |
| **Archivos nuevos** | ~4 (adapters/ai/*) |
| **Archivos modificados** | 1 (app/api/analysis/route.ts) |
| **Riesgo** | Bajo — un solo consumidor, lógica de failover ya existe de forma implícita |
| **Desplegable** | ✅ Mismo comportamiento con failover explícito |
| **Tests** | Unit tests AIProviderChain + E2E (analysis endpoint) |
| **Dependencias** | Unit 1 + Unit 3 (analysis route ya usa Container para repos) |

**Entregables:**
- `core/adapters/ai/gemini-provider.ts`
- `core/adapters/ai/groq-provider.ts`
- `core/adapters/ai/default-chain.ts`
- `core/adapters/ai/index.ts`
- Migrar `/api/analysis/route.ts` para usar AIProviderChain

---

### Unit 7: Observability Layer

| Aspecto | Detalle |
|---------|---------|
| **ID** | `unit-observability` |
| **Propósito** | Agregar instrumentación automática (logging + métricas) a toda la capa de abstracción |
| **Archivos nuevos** | ~6 (observability/*, api/metrics, api/health) |
| **Archivos modificados** | 2 (containers para wrappear repos con decorator) |
| **Riesgo** | Bajo — agrega funcionalidad, no modifica lógica existente |
| **Desplegable** | ✅ Agrega endpoints + logging sin cambiar comportamiento |
| **Tests** | Unit tests (logger, metrics, decorator) |
| **Dependencias** | Unit 1 + Unit 2 (decorator wrappea adapters) |
| **Nueva dependencia npm** | `pino`, `pino-pretty` (devDep) |

**Entregables:**
- `core/observability/pino-logger.ts`
- `core/observability/in-memory-metrics.ts`
- `core/observability/instrumented-repository.ts`
- `core/observability/request-context.ts`
- `app/api/metrics/route.ts` — endpoint Prometheus
- `app/api/health/route.ts` — health check

---

### Unit 8: AWS Stubs + Architecture Diagrams

| Aspecto | Detalle |
|---------|---------|
| **ID** | `unit-aws-stubs-docs` |
| **Propósito** | Crear stubs de implementación AWS para contract tests + diagramas de arquitectura (.drawio) |
| **Archivos nuevos** | ~16 (adapters/aws/*, diagramas .drawio) |
| **Archivos modificados** | 0 |
| **Riesgo** | Nulo — stubs y documentación, no afecta runtime |
| **Desplegable** | ✅ No se activa en runtime (solo contract tests) |
| **Tests** | Contract tests (mismos tests corren contra Supabase adapters Y AWS stubs) |
| **Dependencias** | Unit 1 (interfaces) |
| **Nueva dependencia npm** | `fast-check` (devDep) para PBT |

**Entregables:**
- `core/adapters/aws/repositories/*.ts` — 11 stubs
- `core/adapters/aws/auth/cognito-auth-provider.ts` — stub
- `core/adapters/aws/bedrock-provider.ts` — stub
- `docs/arquitectura-abstraccion-actual.drawio` — Diagrama estado actual
- `docs/arquitectura-abstraccion-objetivo.drawio` — Diagrama target (ports/adapters)
- `docs/comparacion-supabase-aws.drawio` — Comparación visual de servicios

---

## Resumen de Units

| # | Unit | Archivos Nuevos | Modificados | Riesgo | Deps |
|---|------|----------------|-------------|--------|------|
| 1 | Core Foundation | ~25 | 0 | Nulo | — |
| 2 | Supabase Adapters | ~14 | 0 | Bajo | 1 |
| 3 | Server-Side Migration | 0 | ~8 | Medio | 1, 2 |
| 4 | Client-Side Migration | 0 | ~5 | Medio | 1, 2 |
| 5 | Auth Abstraction | ~4 | ~4 | Alto | 1, 3 |
| 6 | AI Abstraction | ~4 | 1 | Bajo | 1, 3 |
| 7 | Observability Layer | ~6 | 2 | Bajo | 1, 2 |
| 8 | AWS Stubs + Diagrams | ~16 | 0 | Nulo | 1 |

**Total**: ~69 archivos nuevos, ~20 modificados

---

## Orden de Ejecución Recomendado

```
Unit 1 (Core Foundation)
    ├── Unit 2 (Supabase Adapters)  ← depende de 1
    │       ├── Unit 3 (Server Migration)  ← depende de 1, 2
    │       │       ├── Unit 5 (Auth)  ← depende de 1, 3
    │       │       └── Unit 6 (AI)    ← depende de 1, 3
    │       └── Unit 4 (Client Migration)  ← depende de 1, 2
    ├── Unit 7 (Observability)  ← depende de 1, 2
    └── Unit 8 (AWS Stubs + Docs)  ← depende de 1
```

**Paralelismo posible:**
- Unit 3 y Unit 4 pueden ejecutarse en paralelo (ambas dependen de 1+2)
- Unit 7 y Unit 8 pueden ejecutarse en paralelo (ambas dependen de 1)
- Unit 5 y Unit 6 pueden ejecutarse en paralelo (ambas dependen de 1+3)
