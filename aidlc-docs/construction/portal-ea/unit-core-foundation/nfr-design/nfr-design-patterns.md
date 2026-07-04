# NFR Design Patterns — Unit 1: Core Foundation

## Resumen

Los patrones de diseño de Unit 1 se enfocan en proveer la infraestructura de types y runtime mínimo (Container) que habilita los patrones de las demás units.

---

## Pattern 1: Service Locator (Container)

### Descripción
Implementación ligera de Service Locator que resuelve dependencias por token tipado. No es un full IoC Container — es deliberadamente simple.

### Estructura

```typescript
class ContainerImpl implements Container {
  private readonly factories = new Map<string, () => unknown>()
  private readonly singletons = new Map<string, unknown>()
  private readonly scopes = new Map<string, 'singleton' | 'transient'>()

  register<T>(token: ServiceToken<T>, factory: () => T, scope: 'singleton' | 'transient' = 'singleton'): void {
    if (this.factories.has(token.name)) {
      throw new InternalError(`Token "${token.name}" ya registrado`)
    }
    this.factories.set(token.name, factory)
    this.scopes.set(token.name, scope)
  }

  resolve<T>(token: ServiceToken<T>): T {
    const factory = this.factories.get(token.name)
    if (!factory) {
      throw new InternalError(`Token "${token.name}" no registrado. ¿Olvidaste registrarlo en el container?`)
    }

    const scope = this.scopes.get(token.name)!
    if (scope === 'singleton') {
      if (!this.singletons.has(token.name)) {
        this.singletons.set(token.name, factory())
      }
      return this.singletons.get(token.name) as T
    }

    return factory() as T
  }

  isRegistered(token: ServiceToken<unknown>): boolean {
    return this.factories.has(token.name)
  }
}
```

### Decisiones de Diseño
- **Map<string, ...>** en vez de Map<Symbol, ...>: permite serialización para debugging
- **Fail-fast**: InternalError si token no registrado (RESILIENCY-10)
- **Duplicate prevention**: Error si se registra el mismo token dos veces
- **Lazy instantiation**: Factory se ejecuta solo al primer resolve
- **~40 LOC**: Mínima complejidad, máxima transparencia

---

## Pattern 2: Discriminated Union (Result Type)

### Descripción
Pattern funcional para manejo de errores sin excepciones. TypeScript narrowing garantiza que el consumer maneja ambos casos.

### Estructura

```typescript
// Core types
type Result<T, E extends DomainError = DomainError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

// Constructors
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
const err = <E extends DomainError>(error: E): Result<never, E> => ({ ok: false, error })

// Type guards
const isOk = <T, E>(r: Result<T, E>): r is { ok: true; value: T } => r.ok
const isErr = <T, E>(r: Result<T, E>): r is { ok: false; error: E } => !r.ok

// Combinators (utilities opcionales)
const map = <T, U, E>(r: Result<T, E>, f: (v: T) => U): Result<U, E> =>
  r.ok ? ok(f(r.value)) : r

const flatMap = <T, U, E>(r: Result<T, E>, f: (v: T) => Result<U, E>): Result<U, E> =>
  r.ok ? f(r.value) : r
```

### Propiedades Algebraicas (PBT-03)
1. **Identity**: `map(ok(x), id) === ok(x)`
2. **Composition**: `map(map(r, f), g) === map(r, x => g(f(x)))`
3. **Left identity of flatMap**: `flatMap(ok(x), f) === f(x)`
4. **Right identity of flatMap**: `flatMap(r, ok) === r`

### Integración con API Routes
```typescript
// Patrón de conversión Result → HTTP Response
function resultToResponse<T>(result: Result<T>): NextResponse {
  if (result.ok) {
    return NextResponse.json(result.value)
  }
  return NextResponse.json(
    { error: result.error.message, code: result.error.code },
    { status: result.error.httpStatus }
  )
}
```

---

## Pattern 3: Token-Based Type Safety

### Descripción
ServiceToken<T> es un value object genérico que porta el tipo T. Cuando el Container resuelve un token, TypeScript infiere el tipo de retorno.

### Estructura

```typescript
class ServiceToken<T> {
  // La propiedad privada garantiza que dos ServiceToken<A> y ServiceToken<B>
  // son incompatibles incluso si A y B tienen la misma shape
  private readonly _brand: T = undefined as unknown as T
  
  constructor(readonly name: string) {}
}

// Uso type-safe:
const repo = container.resolve(TOKENS.SessionRepository) 
// TypeScript sabe que repo es SessionRepository — no se necesita cast
```

### Beneficio vs string keys
- Con strings: `container.get('SessionRepository')` retorna `unknown` → requiere cast
- Con tokens: `container.resolve(TOKENS.SessionRepository)` retorna `SessionRepository` → zero casts

---

## Pattern 4: Error Hierarchy (Estratificado)

### Descripción
Jerarquía de errores con base abstracta. Cada error conoce su HTTP status y su código semántico, eliminando `switch(error.code)` en los consumers.

### Estructura

```typescript
abstract class DomainError {
  abstract readonly code: string
  abstract readonly message: string  
  abstract readonly httpStatus: number
  readonly timestamp = new Date().toISOString()
  
  constructor(readonly context?: Record<string, string | number | boolean>) {}
  
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      // context NO se expone al cliente — solo para logging interno
    }
  }
}

// Cada subclase es inmutable y autocontenida
class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND' as const
  readonly httpStatus = 404
  constructor(readonly message: string, context?: Record<string, string | number | boolean>) {
    super(context)
  }
}
```

### Pattern de Uso en Adapters
```typescript
// Supabase adapter mapea errores del vendor a DomainError
if (error.code === 'PGRST116') return err(new NotFoundError('Sesión no encontrada', { table: 'sessions', id }))
if (error.code === '23505') return err(new ConflictError('Email ya registrado', { table: 'respondents' }))
// default: return err(new InternalError('Error inesperado'))
```

---

## Pattern 5: Separate Server/Client Boundaries

### Descripción
Dos containers independientes que respetan el boundary server/client de Next.js App Router.

### Estructura

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│       ServerContainer           │     │       ClientContainer           │
│                                 │     │                                 │
│ • Runs in Node.js               │     │ • Runs in Browser               │
│ • Has access to env vars        │     │ • Only NEXT_PUBLIC_* vars       │
│ • Can use service_role key      │     │ • Only anon key (RLS active)    │
│ • Registers ALL tokens          │     │ • Registers CLIENT-SAFE tokens  │
│ • Used by: server components,   │     │ • Used by: 'use client' comps   │
│   API routes, middleware        │     │                                 │
└─────────────────────────────────┘     └─────────────────────────────────┘
```

### Tokens Exclusivos de Server
- `TOKENS.AuthMiddleware` (solo middleware de Next.js)
- Repos con admin client (service_role operations)
- `TOKENS.AIProviderChain` (API keys server-only)

### Tokens Compartidos (ambos containers)
- `TOKENS.SessionRepository` (con diferente implementación: server vs browser client)
- `TOKENS.AuthProvider` (con diferente implementación: SSR cookies vs browser session)
- `TOKENS.Logger`
- `TOKENS.MetricsCollector`

---

## Resumen de Patterns

| Pattern | LOC aprox | Dependencias | Propósito |
|---------|-----------|-------------|-----------|
| Service Locator | ~40 | 0 | DI sin framework |
| Result<T,E> | ~20 | 0 | Error handling type-safe |
| ServiceToken<T> | ~10 | 0 | Resolución tipada |
| DomainError hierarchy | ~60 | 0 | Errores semánticos |
| Server/Client boundary | ~20 | 0 | Separación de contextos |
| **Total Unit 1** | **~150** | **0** | — |
