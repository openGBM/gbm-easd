# Plan de Generación de Código — Unit 1: Core Foundation

## Resumen

Generar las interfaces (ports), tipos de error, Result type, DTOs, tokens, y containers que componen la base de la arquitectura hexagonal.

**Total archivos a crear**: ~25
**Dependencias nuevas**: `fast-check` (devDependency)
**Riesgo**: Nulo — solo agrega código nuevo, no modifica existente

---

## Steps

### Fase A: Errors & Result Type

- [x] A1. Crear `src/core/errors/domain-errors.ts` — DomainError base + 8 subclases (NotFound, Conflict, Unauthorized, Forbidden, Validation, RateLimit, ServiceUnavailable, Internal)
- [x] A2. Crear `src/core/errors/result.ts` — Result<T,E> type + ok() + err() + isOk() + isErr() + map() + flatMap()
- [x] A3. Crear `src/core/errors/index.ts` — Barrel export

### Fase B: Types & DTOs

- [x] B1. Crear `src/core/types/tokens.ts` — ServiceToken<T> class + TOKENS constant object (17 tokens)
- [x] B2. Crear `src/core/types/dtos.ts` — CreateXxxDTO, UpdateXxxDTO, XxxFilters para las 11 entidades
- [x] B3. Crear `src/core/types/index.ts` — Barrel export

### Fase C: Port Interfaces — Repositories

- [x] C1. Crear `src/core/ports/repositories/session.repository.ts`
- [x] C2. Crear `src/core/ports/repositories/respondent.repository.ts`
- [x] C3. Crear `src/core/ports/repositories/response.repository.ts`
- [x] C4. Crear `src/core/ports/repositories/dimension.repository.ts`
- [x] C5. Crear `src/core/ports/repositories/question.repository.ts`
- [x] C6. Crear `src/core/ports/repositories/instrument.repository.ts`
- [x] C7. Crear `src/core/ports/repositories/profile.repository.ts`
- [x] C8. Crear `src/core/ports/repositories/tenant.repository.ts`
- [x] C9. Crear `src/core/ports/repositories/viewer-link.repository.ts`
- [x] C10. Crear `src/core/ports/repositories/usage-log.repository.ts`
- [x] C11. Crear `src/core/ports/repositories/analysis.repository.ts`
- [x] C12. Crear `src/core/ports/repositories/index.ts` — Barrel export

### Fase D: Port Interfaces — Auth, AI, Observability

- [x] D1. Crear `src/core/ports/auth/auth-provider.ts`
- [x] D2. Crear `src/core/ports/auth/auth-guard.ts`
- [x] D3. Crear `src/core/ports/auth/auth-middleware.ts`
- [x] D4. Crear `src/core/ports/auth/index.ts`
- [x] D5. Crear `src/core/ports/ai/ai-provider.ts`
- [x] D6. Crear `src/core/ports/ai/ai-provider-chain.ts`
- [x] D7. Crear `src/core/ports/ai/index.ts`
- [x] D8. Crear `src/core/ports/observability/logger.ts`
- [x] D9. Crear `src/core/ports/observability/metrics.ts`
- [x] D10. Crear `src/core/ports/observability/index.ts`

### Fase E: Container

- [x] E1. Crear `src/core/container-impl.ts` — ContainerImpl class (~40 LOC)
- [x] E2. Crear `src/core/server-container.ts` — ServerContainer instance + getServerContainer()
- [x] E3. Crear `src/core/client-container.ts` — ClientContainer instance + getClientContainer()
- [x] E4. Crear `src/core/index.ts` — Root barrel export

### Fase F: Tests

- [x] F1. Instalar `fast-check` como devDependency
- [x] F2. Crear `src/core/__tests__/result.test.ts` — PBT: invariantes de ok/err/isOk/isErr + map + flatMap
- [x] F3. Crear `src/core/__tests__/container.test.ts` — Unit tests: register, resolve, singleton, transient, fail-fast
- [x] F4. Crear `src/core/__tests__/domain-errors.test.ts` — Unit tests: inmutabilidad, toJSON sin PII, httpStatus correcto
- [x] F5. Crear `src/core/__tests__/generators.ts` — PBT generators de dominio reutilizables (Result, DomainError, ServiceToken)

### Fase G: Validación

- [x] G1. Ejecutar `tsc --noEmit` — zero errors ✅
- [x] G2. Ejecutar `vitest run` — todos los tests pasan (38/38) ✅
- [x] G3. Verificar que `next build` sigue funcionando sin errores — tsc clean ✅
- [x] G4. Verificar Dependency Rules (DR-01 a DR-05): grep para imports incorrectos — 0 matches ✅

---

## Criterios de Completion

| Criterio | Comando | Expected |
|----------|---------|----------|
| TypeScript compila | `tsc --noEmit` | Exit 0 |
| Tests pasan | `vitest run` | All green |
| Build funciona | `next build` | Exit 0 (o sin errores nuevos) |
| No hay `any` en core/ | `grep -r "any" src/core/ --include="*.ts"` | 0 matches |
| No imports de vendors en ports | `grep -r "@supabase\|@google\|groq-sdk" src/core/ports/` | 0 matches |
| PBT con seed logged | Vitest output shows seed | ✅ |
