# Mapeo de Requerimientos a Unidades — Abstracción Arquitectónica v3.1

## Nota

Este proyecto no generó User Stories (stage SKIP — refactoring interno). En su lugar, este documento mapea los **Requerimientos Funcionales y No Funcionales** a las unidades de trabajo.

---

## Mapeo RF → Units

| Requerimiento | Descripción | Unit(s) |
|---------------|-------------|---------|
| RF-ABS-01 | Capa de Repositorio (Repository Pattern) | Unit 1 (interfaces) + Unit 2 (adapters) |
| RF-ABS-02 | Capa de Autenticación Abstracta | Unit 1 (interfaces) + Unit 5 (adapter + migración) |
| RF-ABS-03 | Inyección de Dependencias / Service Locator | Unit 1 (Container) |
| RF-ABS-04 | Implementación por Fases (Branch by Abstraction) | Units 1-8 (el plan entero es la implementación por fases) |
| RF-ABS-05 | Capa de Abstracción de IA (AIProvider) | Unit 1 (interfaces) + Unit 6 (adapter + migración) |
| RF-ABS-06 | Observabilidad Integrada | Unit 1 (interfaces) + Unit 7 (implementación) |

---

## Mapeo RNF → Units

| Requerimiento | Descripción | Unit(s) |
|---------------|-------------|---------|
| RNF-ABS-01 | Zero Overhead en Producción (<5ms, <10KB) | Unit 7 (validar) + Build & Test |
| RNF-ABS-02 | Type Safety Completa | Unit 1 (Result type, generics) — validado en todas |
| RNF-ABS-03 | Testing de la Abstracción | Unit 2 (contract tests) + Unit 8 (PBT + contracts AWS) |
| RNF-ABS-04 | Compatibilidad con RLS de Supabase | Unit 2 (adapters respetan RLS) |
| RNF-ABS-05 | Documentación de Decisiones (ADR + drawio) | Unit 8 (diagramas) + transversal (ADRs durante diseño) |
| RNF-ABS-06 | Seguridad (SECURITY extension) | Transversal — aplicada en Unit 2, 3, 4, 5 |
| RNF-ABS-07 | Resiliencia (RESILIENCY extension) | Unit 6 (failover AI) + Unit 7 (health check, timeouts) |
| RNF-ABS-08 | Property-Based Testing | Unit 2 (round-trip) + Unit 8 (generators + PBT suite) |

---

## Mapeo de Restricciones Absolutas → Units

| Restricción | Unit(s) afectadas |
|-------------|-------------------|
| NUNCA desactivar RLS | Unit 2, 3, 4 (adapters y migraciones) |
| NUNCA exponer API keys | Unit 5 (auth), Unit 6 (AI keys) |
| NUNCA romper E2E tests | Unit 3, 4, 5, 6 (cada una valida con Playwright) |
| $0 costo adicional | Unit 7 (observabilidad en memoria, no SaaS) |
| No cambiar la UX | Unit 3, 4, 5 (solo internals cambian) |

---

## Cobertura de Requerimientos por Unit

| Unit | RFs cubiertos | RNFs cubiertos | % Cobertura |
|------|--------------|----------------|-------------|
| 1 - Core Foundation | RF-01, RF-02, RF-03, RF-05, RF-06 (parcial: interfaces) | RNF-02 | Interfaces solamente |
| 2 - Supabase Adapters | RF-01 (implementación) | RNF-03, RNF-04, RNF-08 | 100% de repos |
| 3 - Server-Side Migration | RF-04 (fase 3) | RNF-01, RNF-06 | Server pages |
| 4 - Client-Side Migration | RF-04 (fase 4) | RNF-01, RNF-06 | Client components |
| 5 - Auth Abstraction | RF-02 (implementación) | RNF-06 | Auth completo |
| 6 - AI Abstraction | RF-05 (implementación) | RNF-07 | AI completo |
| 7 - Observability | RF-06 (implementación) | RNF-01, RNF-07 | Observability completo |
| 8 - AWS Stubs + Docs | RF-04 (fase 7-8) | RNF-03, RNF-05, RNF-08 | Future-ready |

---

## Criterios de Aceptación por Unit

### Unit 1: Core Foundation
- [ ] Todas las interfaces compilan sin errores (`tsc --noEmit`)
- [ ] Result<T, E> funciona con discriminated union exhaustive checks
- [ ] Container resuelve tokens correctamente en unit tests
- [ ] Zero dependencias externas (solo TypeScript)

### Unit 2: Supabase Adapters
- [ ] Cada adapter pasa contract tests (misma interfaz, misma validación)
- [ ] RLS respetado (client adapters usan anon key, admin usa service_role)
- [ ] PBT: round-trip de DTO → Supabase → Result para cada entity
- [ ] Errores mapeados correctamente a DomainError subclases

### Unit 3: Server-Side Migration
- [ ] Cero imports de `@supabase/*` en archivos server migrados
- [ ] E2E Playwright pasa sin modificaciones a los tests
- [ ] Encuesta pública funciona end-to-end (registro → respuestas → resultados)

### Unit 4: Client-Side Migration
- [ ] Cero imports de `lib/supabase/client` en componentes migrados
- [ ] E2E Playwright pasa sin modificaciones
- [ ] AdminDashboard funciona (CRUD sesiones, filtros, QR)

### Unit 5: Auth Abstraction
- [ ] Login/logout funciona via AuthProvider
- [ ] Middleware protege rutas /admin/* correctamente
- [ ] Roles (super_admin, admin, editor) se verifican via AuthGuard
- [ ] E2E admin-flow.spec.ts pasa

### Unit 6: AI Abstraction
- [ ] Failover Gemini → Groq funciona cuando primary falla
- [ ] Métricas por provider (latencia, tokens, errores)
- [ ] /api/analysis retorna análisis correcto
- [ ] Cero imports de `@google/generative-ai` o `groq-sdk` fuera de adapters/ai/

### Unit 7: Observability
- [ ] GET /api/metrics retorna formato Prometheus
- [ ] GET /api/health retorna status con checks de DB + Auth
- [ ] Logs JSON en producción, pretty en desarrollo
- [ ] Request-id se propaga en toda la cadena
- [ ] < 5ms overhead por operación instrumentada

### Unit 8: AWS Stubs + Diagrams
- [ ] Contract tests pasan contra stubs AWS (mismos tests que Supabase adapters)
- [ ] PBT: generators de dominio funcionan con fast-check
- [ ] Diagramas .drawio generados (actual, objetivo, comparación)
- [ ] Diagramas validables visualmente
