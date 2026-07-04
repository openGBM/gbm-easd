# Modelo de Lógica de Negocio — Unit 1: Core Foundation

## Resumen

La Unit 1 no contiene lógica de negocio ejecutable — es una unidad puramente declarativa (interfaces, tipos, container). Su "lógica" es la mecánica del Container y los contratos de los ports.

---

## 1. Flujo del Container (Resolve)

```
Consumer llama container.resolve(TOKENS.SessionRepository)
  │
  ├── ¿Token registrado?
  │     ├── NO → lanzar InternalError("Token SessionRepository no registrado")
  │     └── SÍ → continuar
  │
  ├── ¿Scope = singleton?
  │     ├── SÍ → ¿Instancia cacheada?
  │     │         ├── SÍ → retornar instancia cacheada
  │     │         └── NO → ejecutar factory(), cachear, retornar
  │     └── NO (transient) → ejecutar factory(), retornar (sin cachear)
  │
  └── Retornar instancia tipada como T
```

---

## 2. Flujo del Result Type (Consumer Pattern)

```typescript
// Patrón de consumo obligatorio
const result = await sessionRepo.findById(id)

if (!result.ok) {
  // TypeScript sabe que result.error es DomainError
  // El consumer DEBE manejar el error
  return handleError(result.error)
}

// TypeScript sabe que result.value es Session
const session = result.value
```

---

## 3. Flujo de Error Mapping (en Adapters — definido en Unit 2)

Los adapters mapean errores del vendor a DomainError. El flujo aquí solo define el contrato:

```
Adapter ejecuta operación vendor (ej: supabase.from(...).select())
  │
  ├── Éxito → return ok(data)
  │
  └── Error del vendor
        ├── Not found (ej: no rows) → return err(new NotFoundError(...))
        ├── Unique violation (code 23505) → return err(new ConflictError(...))
        ├── Auth error → return err(new UnauthorizedError(...))
        ├── Timeout → return err(new ServiceUnavailableError(...))
        └── Desconocido → return err(new InternalError(...))
```

---

## 4. Inicialización del Container

### ServerContainer Bootstrap

```
1. Verificar variables de entorno (NEXT_PUBLIC_SUPABASE_URL, etc.)
2. Registrar factories para cada token:
   - TOKENS.SessionRepository → () => new SupabaseSessionRepository(serverClient)
   - TOKENS.AuthProvider → () => new SupabaseAuthProvider(serverClient)
   - TOKENS.AIProviderChain → () => new DefaultAIProviderChain([gemini, groq])
   - TOKENS.Logger → () => new PinoLogger(config)
   - TOKENS.MetricsCollector → () => new InMemoryMetricsCollector()
   - ... (todos los demás tokens)
3. Container listo para resolve()
```

### ClientContainer Bootstrap

```
1. Verificar variables de entorno client (NEXT_PUBLIC_*)
2. Registrar factories con browser client:
   - TOKENS.SessionRepository → () => new SupabaseSessionRepository(browserClient)
   - TOKENS.AuthProvider → () => new SupabaseAuthProvider(browserClient)
   - TOKENS.Logger → () => new PinoLogger(clientConfig)
   - ... (subset de tokens disponibles en client)
3. Container listo para resolve()
```

**Nota**: El ClientContainer NO registra tokens que requieren service_role (admin operations). Intentar resolver un token no registrado en client causa InternalError.

---

## 5. Port Contracts (Interface Semantics)

Cada interface de repository tiene la siguiente semántica general:

| Método pattern | Comportamiento |
|----------------|---------------|
| `findById(id)` | Retorna `ok(entity)` si existe, `err(NotFoundError)` si no |
| `findAll(filters?)` | Retorna `ok([])` si no hay resultados (no es error) |
| `create(dto)` | Retorna `ok(entity)` con ID generado, `err(ConflictError)` si duplicado |
| `update(id, dto)` | Retorna `ok(entity)` actualizado, `err(NotFoundError)` si no existe |
| `delete(id)` | Retorna `ok(void)` si se eliminó, `err(NotFoundError)` si no existe |
| `count*(...)` | Retorna `ok(number)`, nunca falla (0 es válido) |

---

## 6. Observability Contracts (Interface Semantics)

### Logger
- `info/warn/error/debug` son fire-and-forget (no retornan Result, no fallan)
- `child(context)` retorna un nuevo Logger con context heredado
- En producción: JSON a stdout
- En desarrollo: pretty format con colores

### MetricsCollector
- `recordLatency/recordError/incrementCounter` son fire-and-forget
- `getMetrics()` retorna snapshot de todas las métricas acumuladas
- `reset()` limpia todas las métricas (para testing)
- Las métricas se pierden en restart (in-memory, aceptable por restricción $0)

---

## 7. Diagrama de Módulos (Unit 1)

```
core/
├── ports/
│   ├── repositories/     ← 11 interfaces (SessionRepository, etc.)
│   │   └── index.ts      ← barrel export
│   ├── auth/             ← 3 interfaces (AuthProvider, AuthGuard, AuthMiddleware)
│   │   └── index.ts
│   ├── ai/              ← 2 interfaces (AIProvider, AIProviderChain)
│   │   └── index.ts
│   └── observability/   ← 2 interfaces (Logger, MetricsCollector)
│       └── index.ts
├── errors/
│   ├── domain-errors.ts  ← DomainError base + 8 subclases
│   └── result.ts         ← Result<T,E> + ok() + err() + isOk() + isErr()
├── types/
│   ├── tokens.ts         ← TOKENS constant object
│   └── dtos.ts           ← CreateXxxDTO, UpdateXxxDTO, XxxFilters
├── server-container.ts   ← ServerContainer (skeleton — factories se llenan en Unit 2)
└── client-container.ts   ← ClientContainer (skeleton — factories se llenan en Unit 2)
```

**Total archivos en Unit 1**: ~25
**Dependencias externas**: 0 (solo TypeScript puro)
**Tests**: Unit tests del Container + PBT de Result type
