# Logical Components — Unit 1: Core Foundation

## Resumen

Los componentes lógicos de Unit 1 son las piezas de infraestructura interna que soportan toda la capa de abstracción. No hay infraestructura externa (no hay queues, caches, ni servicios cloud) — todo es código TypeScript puro.

---

## 1. ContainerImpl (Server + Client)

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | Runtime component — Singleton por contexto |
| **Responsabilidad** | Almacenar factories, resolver dependencias, cachear singletons |
| **Estado interno** | `factories: Map`, `singletons: Map`, `scopes: Map` |
| **Thread-safety** | N/A (Node.js single-threaded, pero múltiples requests concurrentes son safe porque las factories son sync) |
| **Inicialización** | Al boot de la aplicación (server) o al mount del primer component (client) |
| **Ciclo de vida** | Vive toda la duración del proceso Node.js (server) o de la sesión del browser (client) |

### API Interna

```typescript
// server-container.ts
import { ContainerImpl } from './container-impl'
import { TOKENS } from './types/tokens'

const serverContainer = new ContainerImpl()

// Las factories se registran aquí (skeleton — se llena en Unit 2)
export function getServerContainer(): Container {
  return serverContainer
}

// client-container.ts
const clientContainer = new ContainerImpl()

export function getClientContainer(): Container {
  return clientContainer
}
```

---

## 2. Result Module

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | Pure utility module — sin estado |
| **Responsabilidad** | Proveer constructores (`ok`, `err`) y type guards (`isOk`, `isErr`) |
| **Estado interno** | Ninguno — funciones puras |
| **Exports** | `Result<T,E>`, `ok()`, `err()`, `isOk()`, `isErr()`, `map()`, `flatMap()` |
| **Tree-shakeable** | ✅ Cada función es exportada independientemente |

### Diagrama de Uso

```
API Route / Page / Component
       │
       │ usa Result<T,E>
       ▼
┌─────────────────────┐
│   result.ts          │
│                      │
│ ok(value) → Result   │
│ err(error) → Result  │
│ isOk(r) → boolean    │
│ isErr(r) → boolean   │
│ map(r, f) → Result   │
│ flatMap(r, f) → Res  │
└─────────────────────┘
```

---

## 3. DomainError Module

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | Class hierarchy — instanciable |
| **Responsabilidad** | Representar errores de dominio con semántica HTTP y código |
| **Estado interno** | Inmutable por instancia (readonly fields) |
| **Exports** | `DomainError` (base), 8 subclases, type `DomainErrorCode` |
| **Serialización** | `toJSON()` retorna representación safe para HTTP response (sin context interno) |

### Diagrama de Jerarquía

```
DomainError (abstract)
├── NotFoundError        (404)
├── ConflictError        (409)
├── UnauthorizedError    (401)
├── ForbiddenError       (403)
├── ValidationError      (400) — con fieldErrors
├── RateLimitError       (429)
├── ServiceUnavailableError (503)
└── InternalError        (500)
```

---

## 4. Tokens Module

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | Constant definitions — sin runtime behavior |
| **Responsabilidad** | Single source of truth de todos los ServiceToken del sistema |
| **Estado interno** | Ninguno — `as const` object |
| **Exports** | `TOKENS` object, `ServiceToken<T>` class |

### Organización

```typescript
export const TOKENS = {
  // Repositories (11)
  SessionRepository: new ServiceToken<SessionRepository>('SessionRepository'),
  RespondentRepository: new ServiceToken<RespondentRepository>('RespondentRepository'),
  // ... etc

  // Auth (3)
  AuthProvider: new ServiceToken<AuthProvider>('AuthProvider'),
  AuthGuard: new ServiceToken<AuthGuard>('AuthGuard'),
  AuthMiddleware: new ServiceToken<AuthMiddleware>('AuthMiddleware'),

  // AI (1)
  AIProviderChain: new ServiceToken<AIProviderChain>('AIProviderChain'),

  // Observability (2)
  Logger: new ServiceToken<Logger>('Logger'),
  MetricsCollector: new ServiceToken<MetricsCollector>('MetricsCollector'),
} as const
```

---

## 5. DTOs Module

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | Type definitions — sin runtime behavior |
| **Responsabilidad** | Definir la forma de datos de entrada para cada operación |
| **Exports** | `CreateXxxDTO`, `UpdateXxxDTO`, `XxxFilters` para cada entidad |
| **Relación con Zod** | Los DTOs definen la forma; Zod schemas en la API layer validan contra ellos |

---

## 6. Port Interfaces (11 Repos + 3 Auth + 2 AI + 2 Observability)

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | TypeScript interfaces — eliminadas en compilación |
| **Responsabilidad** | Definir contratos que los adapters deben cumplir |
| **Estado** | Zero runtime footprint |
| **Organización** | `core/ports/repositories/`, `core/ports/auth/`, `core/ports/ai/`, `core/ports/observability/` |
| **Barrel exports** | Cada subdirectorio tiene `index.ts` que re-exporta todo |

---

## Diagrama de Componentes Lógicos (Unit 1)

```
┌─────────────────────────────────────────────────────────────────┐
│                        core/ (Unit 1)                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   PORTS (interfaces)                     │   │
│  │  repositories/ │ auth/ │ ai/ │ observability/            │   │
│  │  (zero runtime)                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │  errors/       │  │  types/        │  │  containers        │ │
│  │                │  │                │  │                    │ │
│  │  DomainError   │  │  tokens.ts     │  │  server-container  │ │
│  │  result.ts     │  │  dtos.ts       │  │  client-container  │ │
│  │  (8 subclases) │  │  (ServiceToken)│  │  (ContainerImpl)   │ │
│  └────────────────┘  └────────────────┘  └────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Dependencias: NINGUNA external
Runtime footprint: Solo ContainerImpl (~40 LOC ejecutable)
Todo lo demás: Types eliminados en compilación
```

---

## Interacción entre Componentes Lógicos

| Componente | Usa | Es usado por |
|------------|-----|-------------|
| Ports (interfaces) | types/dtos.ts, errors/result.ts | Adapters (Unit 2+), Consumers (Unit 3+) |
| errors/domain-errors.ts | — | Adapters, Consumers, Container |
| errors/result.ts | errors/domain-errors.ts | Ports, Adapters, Consumers |
| types/tokens.ts | Ports (para generics) | Container, Consumers |
| types/dtos.ts | — | Ports, Adapters |
| ContainerImpl | errors/domain-errors.ts (InternalError) | server-container, client-container |
| server-container | ContainerImpl, TOKENS | Server Components, API Routes, Middleware |
| client-container | ContainerImpl, TOKENS | Client Components |

---

## Consideraciones de Performance

| Componente | Costo Runtime |
|------------|--------------|
| Ports | 0 (eliminados en compilación) |
| DTOs | 0 (solo types) |
| Tokens | ~1KB (object con 17 entries) |
| DomainError classes | ~2KB (8 clases simple) |
| Result utilities | ~0.5KB (6 funciones) |
| ContainerImpl | ~1KB + Maps (~1KB per 17 entries) |
| **Total runtime Unit 1** | **~5KB** |
