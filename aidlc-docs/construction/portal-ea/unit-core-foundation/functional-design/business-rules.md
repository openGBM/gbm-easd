# Reglas de Negocio — Unit 1: Core Foundation

## Resumen

La Unit 1 define contratos e infraestructura de tipos. Sus "reglas de negocio" son **reglas de diseño** que gobiernan cómo los ports, errors, y el container deben comportarse.

---

## BR-CF-01: Result Type es Exhaustivo

**Regla**: Todo método de un port DEBE retornar `Result<T, E>`. El consumer DEBE manejar ambos casos (`ok` y `error`) de forma explícita. No se permite ignorar el caso de error.

**Validación**: TypeScript strict mode + narrowing obliga a verificar `.ok` antes de acceder a `.value`.

---

## BR-CF-02: DomainError es Inmutable

**Regla**: Todas las instancias de `DomainError` son de solo lectura (`readonly`). Una vez creado un error, sus propiedades no pueden modificarse.

**Razón**: Los errores se propagan a través de múltiples capas; mutabilidad causaría bugs sutiles.

---

## BR-CF-03: DomainError No Expone PII

**Regla**: El campo `context` de `DomainError` NUNCA debe contener información personal identificable (emails, nombres, tokens). Solo puede contener metadata técnica (IDs, nombres de tabla, tipo de operación).

**Validación**: Code review + regla SECURITY-03 (logs sin PII).

---

## BR-CF-04: ValidationError Incluye Detalles por Campo

**Regla**: `ValidationError` DEBE incluir `fieldErrors: Record<string, string[]>` que describe exactamente qué campos fallaron y por qué. Esto permite al frontend mostrar errores inline por campo.

**Formato**: `{ "email": ["Formato inválido"], "name": ["Mínimo 2 caracteres"] }`

---

## BR-CF-05: ServiceToken es Único por Nombre

**Regla**: No pueden existir dos `ServiceToken` con el mismo nombre. El Container DEBE lanzar `InternalError` si se intenta registrar un token ya registrado (prevenir doble registro accidental).

**Validación**: Unit test que verifica unicidad.

---

## BR-CF-06: Container Resuelve Lazy

**Regla**: El Container NO crea instancias al momento del registro (`register()`). Las instancias se crean al primer `resolve()` (lazy initialization). Singletons se cachean después del primer resolve.

**Razón**: Evitar crear clientes de Supabase u otros recursos costosos si nunca se usan en un request particular.

---

## BR-CF-07: Container Falla Rápido

**Regla**: Si se invoca `resolve()` con un token no registrado, el Container DEBE lanzar `InternalError` inmediatamente con mensaje descriptivo (qué token falta). No retorna `null` ni `undefined`.

**Razón**: Fail-fast para detectar configuración incorrecta en desarrollo, no en producción bajo carga.

---

## BR-CF-08: Ports Son Technology-Agnostic

**Regla**: Ninguna interfaz de port puede importar tipos de un vendor específico (`@supabase/*`, `@google/*`, `groq-sdk`, `@aws-sdk/*`). Los ports solo importan tipos de `core/types/` y `core/errors/`.

**Validación**: Dependency Rule DR-02 (grep imports en `core/ports/`).

---

## BR-CF-09: DTOs Validan en el Adapter, No en el Port

**Regla**: Los ports definen la forma de los DTOs (shape), pero NO ejecutan validación. La validación (Zod, guards) ocurre en la capa del consumer (API route) ANTES de invocar al repository. El adapter confía en que recibe datos ya validados.

**Razón**: Los ports son interfaces puras. La validación es responsabilidad del boundary (API layer).

---

## BR-CF-10: Separación Server vs Client Container

**Regla**: El `ServerContainer` y `ClientContainer` son instancias separadas con registros independientes. Un componente server NUNCA debe usar el `ClientContainer` y viceversa.

| Container | Disponible en | Usa |
|-----------|---------------|-----|
| ServerContainer | Server Components, API Routes, Middleware | server client, service_role |
| ClientContainer | Client Components ('use client') | browser client, anon key |

**Validación**: Import paths distintos (`core/server-container` vs `core/client-container`).

---

## BR-CF-11: Tokens Predefinidos como Constantes

**Regla**: Todos los tokens de servicio se definen una sola vez en `core/types/tokens.ts` como constantes exportadas (`TOKENS`). No se crean tokens ad-hoc en otros archivos.

**Razón**: Single source of truth para la configuración del container, facilita autocompletar.

---

## BR-CF-12: Result Helpers Son Puros

**Regla**: Las funciones helper `ok()`, `err()`, `isOk()`, `isErr()` son funciones puras sin side effects. No logean, no mutan, no lanzan excepciones.

**Propiedad PBT**: `isOk(ok(x)) === true` para todo `x`. `isErr(err(e)) === true` para todo `e`.

---

## Propiedades Testables (PBT-01)

| Propiedad | Categoría PBT | Descripción |
|-----------|---------------|-------------|
| `ok(x).value === x` | Invariant | El valor se preserva sin mutación |
| `err(e).error === e` | Invariant | El error se preserva sin mutación |
| `isOk(ok(x)) === true` | Invariant | ok siempre es reconocido como ok |
| `isErr(err(e)) === true` | Invariant | err siempre es reconocido como err |
| `!isOk(err(e))` | Invariant | err nunca es confundido con ok |
| `!isErr(ok(x))` | Invariant | ok nunca es confundido con err |
| ServiceToken uniqueness | Invariant | Dos tokens con diferente nombre nunca resuelven lo mismo |
| Container resolve(register(token, f)) === f() | Round-trip | Lo que se registra es lo que se resuelve |
