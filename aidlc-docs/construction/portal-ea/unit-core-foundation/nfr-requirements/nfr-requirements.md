# NFR Requirements — Unit 1: Core Foundation

## Resumen

La Unit 1 (Core Foundation) es código puramente declarativo sin runtime overhead ni I/O. Sus NFRs se centran en type-safety, rendimiento del container, y testabilidad.

---

## NFR-U1-01: Zero Runtime Overhead de Interfaces

| Aspecto | Criterio |
|---------|----------|
| **Requisito** | Las interfaces TypeScript se eliminan en compilación — cero overhead en runtime |
| **Medición** | Bundle size de `core/ports/` = 0 bytes (interfaces no existen en JS) |
| **Validación** | `next build` → verificar que output no contiene definiciones de interface |

---

## NFR-U1-02: Container — Rendimiento de Resolución

| Aspecto | Criterio |
|---------|----------|
| **Requisito** | `container.resolve()` debe completar en < 0.1ms (100μs) por llamada |
| **Razón** | Se invoca múltiples veces por request; no debe agregar latencia perceptible |
| **Medición** | Benchmark con `performance.now()` en unit test |
| **Validación** | PBT: resolver N tokens random en secuencia, promedio < 0.1ms |

---

## NFR-U1-03: Type Safety — Strict Mode

| Aspecto | Criterio |
|---------|----------|
| **Requisito** | Todo código en `core/` debe compilar con `strict: true` sin errores |
| **Prohibido** | `any`, `as unknown as T`, `@ts-ignore`, `@ts-expect-error` |
| **Validación** | `tsc --noEmit --strict` exit 0 |

---

## NFR-U1-04: Result Type — Exhaustive Pattern Matching

| Aspecto | Criterio |
|---------|----------|
| **Requisito** | TypeScript narrowing garantiza que acceder a `.value` sin check de `.ok` es error de compilación |
| **Medición** | Tests con `// @ts-expect-error` que prueban que el error de compilación SI ocurre |
| **Validación** | tsc type tests |

---

## NFR-U1-05: Tree-Shaking Compatible

| Aspecto | Criterio |
|---------|----------|
| **Requisito** | Los módulos de `core/` deben ser tree-shakeable — solo lo que se importa se incluye |
| **Implementación** | Named exports, no `export default`, barrel index.ts con re-exports explícitos |
| **Validación** | Client bundle no incluye tokens de auth/admin si la página no los usa |

---

## NFR-U1-06: Testing — Property-Based Testing del Result Type

| Aspecto | Criterio |
|---------|----------|
| **Requisito** | Result<T,E> y Container deben tener PBT que validen propiedades algebraicas |
| **Framework** | fast-check (integrado con Vitest) |
| **Propiedades** | 8 propiedades identificadas en business-rules.md (BR-CF-12) |
| **Validación** | `vitest run --filter pbt` con seed logging |

---

## NFR-U1-07: Seguridad — No PII en Errors

| Aspecto | Criterio |
|---------|----------|
| **Requisito** | DomainError.context NUNCA contiene PII (SECURITY-03) |
| **Implementación** | Type constraint: `context?: Record<string, string | number | boolean>` (no objects complejos) |
| **Validación** | Code review + PBT que genera errors random y verifica ausencia de patterns de PII |

---

## NFR-U1-08: Resiliencia — Fail-Fast en Container

| Aspecto | Criterio |
|---------|----------|
| **Requisito** | Token no registrado → InternalError inmediato (RESILIENCY-10: no unbounded waits) |
| **Implementación** | Verificación síncrona al llamar resolve() |
| **Validación** | Unit test: resolve(unregistered) throws InternalError |

---

## Resumen de Compliance por Extensión

### Security (aplicable a Unit 1)

| Regla | Estado | Nota |
|-------|--------|------|
| SECURITY-03 | ✅ | No PII en errors — type constraint |
| SECURITY-05 | N/A | No hay API endpoints en esta unit |
| SECURITY-09 | ✅ | No credentials, no defaults |
| SECURITY-12 | ✅ | No passwords/keys en código |
| SECURITY-15 | ✅ | Container fail-fast (InternalError) |

### Resiliency (aplicable a Unit 1)

| Regla | Estado | Nota |
|-------|--------|------|
| RESILIENCY-05 | N/A | No hay runtime monitoring (unit de tipos) |
| RESILIENCY-10 | ✅ | Container fail-fast, no unbounded waits |
| Otras | N/A | Esta unit no tiene I/O ni networking |

### PBT (aplicable a Unit 1)

| Regla | Estado | Nota |
|-------|--------|------|
| PBT-01 | ✅ | 8 propiedades identificadas |
| PBT-02 | N/A | No hay serialización en esta unit |
| PBT-03 | ✅ | Invariantes de Result y Container |
| PBT-07 | ✅ | Generators para Result, DomainError, ServiceToken |
| PBT-08 | ✅ | fast-check con shrinking + seed |
| PBT-09 | ✅ | Framework: fast-check |
