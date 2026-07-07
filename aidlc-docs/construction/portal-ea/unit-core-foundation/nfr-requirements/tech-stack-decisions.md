# Tech Stack Decisions — Unit 1: Core Foundation

## Decisiones de Stack para la Capa de Abstracción

---

## TSD-01: TypeScript Strict Mode

| Aspecto | Decisión |
|---------|----------|
| **Decisión** | Usar `strict: true` en todo `core/` |
| **Alternativas** | Strict parcial (noImplicitAny only), modo lax |
| **Razón** | Máxima type safety para la capa de contratos — errors detectados en compile time |
| **Impacto** | Zero runtime cost (eliminado en compilación) |

---

## TSD-02: PBT Framework — fast-check

| Aspecto | Decisión |
|---------|----------|
| **Decisión** | `fast-check` como framework de Property-Based Testing |
| **Versión** | ^3.x (latest stable) |
| **Alternativas** | jsverify (abandonado), hypothesis (Python), proptest (Rust) |
| **Razón** | Integración nativa con Vitest, excelente shrinking, TypeScript-first, mantenido activamente |
| **Integración** | Se usa dentro de archivos `.test.ts` con Vitest — no requiere configuración adicional |
| **Costo** | $0 (devDependency, MIT license) |

---

## TSD-03: Logger — Pino

| Aspecto | Decisión |
|---------|----------|
| **Decisión** | `pino` como implementación del Logger port |
| **Versión** | ^9.x (latest) |
| **Alternativas** | Winston (más pesado, ~80KB), Bunyan (sin mantenimiento), console.log (no estructurado) |
| **Razón** | Fastest Node.js logger, ~2KB bundle, JSON nativo, child loggers, zero-alloc en fast path |
| **DevDep** | `pino-pretty` para formato legible en desarrollo |
| **Costo** | $0 (MIT license) |

**Nota**: Pino se usa en Unit 7 (Observability Layer), pero la decisión se toma aquí para informar el diseño de la interfaz Logger.

---

## TSD-04: Métricas — In-Memory Collector

| Aspecto | Decisión |
|---------|----------|
| **Decisión** | Implementación in-memory con exposición vía `/api/metrics` en formato Prometheus |
| **Alternativas** | OpenTelemetry Collector ($), StatsD ($), Datadog ($$$), sin métricas |
| **Razón** | Restricción de $0 costo. Prometheus format permite scrape futuro con Grafana Cloud free tier |
| **Limitaciones** | Se pierde en restart, solo una instancia (aceptable para single-instance Next.js) |
| **Costo** | $0 (implementación propia, ~100 líneas) |

---

## TSD-05: DI Container — Implementación Propia

| Aspecto | Decisión |
|---------|----------|
| **Decisión** | Service Locator ligero implementado en ~50-80 líneas de TypeScript |
| **Alternativas** | tsyringe (decorators), inversify (pesado ~15KB), awilix (Node-specific), typedi (decorators) |
| **Razón** | Zero bundle impact, no requiere decorators (incompatible con Next.js RSC), máxima simplicidad |
| **Features incluidos** | Registro, resolución, singletons, transients, type-safe tokens |
| **Features excluidos** | Auto-discovery, lifecycle hooks, AOP, scoped containers |
| **Costo** | $0 (código propio, zero dependencies) |

---

## TSD-06: Error Handling — Discriminated Unions (Result Type)

| Aspecto | Decisión |
|---------|----------|
| **Decisión** | Result<T, E> con discriminated union en vez de throw/catch |
| **Alternativas** | throw exceptions (actual), neverthrow (librería), fp-ts Either (pesado), tuple [err, data] |
| **Razón** | Type-safe, exhaustive checking, zero runtime cost, no requiere try/catch, compatible con async/await |
| **Implementación** | ~20 líneas de TypeScript propio (no dependencia externa) |
| **Costo** | $0 (código propio) |

---

## TSD-07: No Framework de Testing Adicional

| Aspecto | Decisión |
|---------|----------|
| **Decisión** | Continuar con Vitest (ya existente) + agregar fast-check como único add-on |
| **Alternativas** | Jest (migración costosa), mocha (sin TypeScript nativo) |
| **Razón** | Vitest ya está configurado, es rápido, soporta ESM nativo, compatible con fast-check |
| **Costo** | $0 (ya instalado) |

---

## Resumen de Dependencias Nuevas (Unit 1)

| Paquete | Tipo | Versión | Tamaño | Uso |
|---------|------|---------|--------|-----|
| `fast-check` | devDependency | ^3.x | ~150KB (dev only) | PBT framework |

**Nota**: `pino` y `pino-pretty` se agregan en Unit 7 (Observability). Para Unit 1 no se agrega ninguna runtime dependency.

---

## Compatibilidad con Infraestructura Existente

| Componente existente | Compatible | Notas |
|---------------------|-----------|-------|
| Next.js 16.x (App Router) | ✅ | Container funciona tanto en server como client |
| TypeScript strict | ✅ | Todo diseñado para strict mode |
| Vitest | ✅ | fast-check se integra directamente |
| Vercel deployment | ✅ | Zero infra adicional |
| Supabase | ✅ | No se toca en esta unit (se wrappea en Unit 2) |
