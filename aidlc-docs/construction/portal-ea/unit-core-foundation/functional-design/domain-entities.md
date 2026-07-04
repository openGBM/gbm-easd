# Entidades de Dominio — Unit 1: Core Foundation

## Resumen

Esta unidad define las **interfaces puras** (ports), los **tipos de error**, el **Result type**, y el **Container de DI**. No contiene lógica de negocio ejecutable — solo contratos y tipos.

---

## 1. Result Type

```typescript
/**
 * Discriminated union para manejo de resultados sin excepciones.
 * Garantiza que el consumer maneje ambos casos (ok/error) de forma explícita.
 */
type Result<T, E extends DomainError = DomainError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

// Helper functions
function ok<T>(value: T): Result<T, never>
function err<E extends DomainError>(error: E): Result<never, E>
function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T }
function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E }
```

---

## 2. DomainError Hierarchy

```typescript
/**
 * Base abstracta para todos los errores de dominio.
 * Cada error tiene un código único, mensaje, y HTTP status asociado.
 */
abstract class DomainError {
  abstract readonly code: string
  abstract readonly message: string
  abstract readonly httpStatus: number
  readonly timestamp: string    // ISO 8601
  readonly context?: Record<string, unknown>  // Metadata adicional (NO PII)
}
```

| Subclase | Code | HTTP | Uso |
|----------|------|------|-----|
| `NotFoundError` | `NOT_FOUND` | 404 | Entidad no existe |
| `ConflictError` | `CONFLICT` | 409 | Duplicado (ej: email ya registrado) |
| `UnauthorizedError` | `UNAUTHORIZED` | 401 | No autenticado |
| `ForbiddenError` | `FORBIDDEN` | 403 | Sin permisos para la operación |
| `ValidationError` | `VALIDATION` | 400 | Input inválido (con detalles por campo) |
| `RateLimitError` | `RATE_LIMIT` | 429 | Límite de requests excedido |
| `ServiceUnavailableError` | `SERVICE_UNAVAILABLE` | 503 | Proveedor externo no disponible |
| `InternalError` | `INTERNAL` | 500 | Error inesperado (no exponer detalles al client) |

### ValidationError (especial)

```typescript
class ValidationError extends DomainError {
  readonly code = 'VALIDATION'
  readonly httpStatus = 400
  readonly fieldErrors: Record<string, string[]>  // campo → mensajes de error
}
```

---

## 3. ServiceToken (DI Tokens)

```typescript
/**
 * Token type-safe para resolver dependencias del Container.
 * Cada token es único y tipado — el Container retorna exactamente T.
 */
class ServiceToken<T> {
  constructor(readonly name: string) {}
}

// Tokens predefinidos
const TOKENS = {
  // Repositories
  SessionRepository: new ServiceToken<SessionRepository>('SessionRepository'),
  RespondentRepository: new ServiceToken<RespondentRepository>('RespondentRepository'),
  ResponseRepository: new ServiceToken<ResponseRepository>('ResponseRepository'),
  DimensionRepository: new ServiceToken<DimensionRepository>('DimensionRepository'),
  QuestionRepository: new ServiceToken<QuestionRepository>('QuestionRepository'),
  InstrumentRepository: new ServiceToken<InstrumentRepository>('InstrumentRepository'),
  ProfileRepository: new ServiceToken<ProfileRepository>('ProfileRepository'),
  TenantRepository: new ServiceToken<TenantRepository>('TenantRepository'),
  ViewerLinkRepository: new ServiceToken<ViewerLinkRepository>('ViewerLinkRepository'),
  UsageLogRepository: new ServiceToken<UsageLogRepository>('UsageLogRepository'),
  AnalysisRepository: new ServiceToken<AnalysisRepository>('AnalysisRepository'),
  // Auth
  AuthProvider: new ServiceToken<AuthProvider>('AuthProvider'),
  AuthGuard: new ServiceToken<AuthGuard>('AuthGuard'),
  AuthMiddleware: new ServiceToken<AuthMiddleware>('AuthMiddleware'),
  // AI
  AIProviderChain: new ServiceToken<AIProviderChain>('AIProviderChain'),
  // Observability
  Logger: new ServiceToken<Logger>('Logger'),
  MetricsCollector: new ServiceToken<MetricsCollector>('MetricsCollector'),
} as const
```

---

## 4. DTOs (Data Transfer Objects)

### Convenciones
- `CreateXxxDTO`: Datos para creación (sin id, sin timestamps)
- `UpdateXxxDTO`: Datos para actualización (todos opcionales via Partial)
- `XxxFilters`: Criterios de búsqueda/filtrado

### Ejemplo representativo

```typescript
interface CreateSessionDTO {
  name: string
  isActive?: boolean        // default: true
  tenantId?: string | null  // null para legacy
  instrumentVersionId?: string | null
}

interface UpdateSessionDTO {
  name?: string
  isActive?: boolean
}

interface SessionFilters {
  tenantId?: string
  isActive?: boolean
  search?: string           // busca en name
  instrumentId?: string
}
```

Los DTOs de todas las 11 entidades siguen el mismo patrón. La especificación completa de cada DTO se define en el artefacto de Component Methods (v3.1-component-methods.md).

---

## 5. Container Interface

```typescript
interface Container {
  /**
   * Resuelve una dependencia por su token.
   * Lanza InternalError si el token no está registrado.
   */
  resolve<T>(token: ServiceToken<T>): T
  
  /**
   * Resuelve una dependencia que requiere inicialización async.
   */
  resolveAsync<T>(token: ServiceToken<T>): Promise<T>
  
  /**
   * Registra una factory para un token.
   * scope: 'singleton' (default) = una instancia; 'transient' = nueva cada vez.
   */
  register<T>(token: ServiceToken<T>, factory: () => T, scope?: 'singleton' | 'transient'): void
  
  /**
   * Verifica si un token está registrado.
   */
  isRegistered(token: ServiceToken<unknown>): boolean
}
```

### Dos instancias concretas:

| Container | Contexto | Qué resuelve |
|-----------|----------|--------------|
| `ServerContainer` | Server Components, API Routes, Middleware | Repos con server client, AuthProvider SSR, AdminClient |
| `ClientContainer` | Client Components ('use client') | Repos con browser client, AuthProvider browser |

---

## 6. Entidades de Dominio (Tipos de Retorno)

Estas son las entidades que retornan los repositories. Se mantienen iguales a los tipos existentes en `types/database.ts`:

| Entidad | Campos clave |
|---------|-------------|
| `Session` | id, name, isActive, tenantId, instrumentVersionId, createdAt |
| `Respondent` | id, sessionId, name, email, completed, createdAt |
| `Response` | id, respondentId, questionId, value, createdAt |
| `Dimension` | id, name, description, displayOrder, color |
| `Question` | id, dimensionId, text, displayOrder |
| `DimensionWithQuestions` | Dimension + questions: Question[] |
| `ResponseWithQuestion` | Response + question: Question + dimension: Dimension |
| `DimensionScore` | dimensionName, dimensionColor, averageValue, responseCount |
| `Instrument` | id, name, description, createdAt |
| `InstrumentVersion` | id, instrumentId, versionNumber, isActive |
| `InstrumentWithVersion` | Instrument + activeVersion: InstrumentVersion |
| `Profile` | id, email, role, tenantId, isActive, displayName |
| `Tenant` | id, name, isActive, maxActiveSessions, maxAnalysesPerMonth |
| `LimitCheck` | allowed, current, limit, message? |
| `ViewerLink` | token, sessionId, expiresAt, isRevoked, createdBy |
| `UsageLog` | id, tenantId, action, createdAt |
| `Analysis` | id, sessionId, content, model, createdAt |
| `AuthUser` | id, email |
| `AuthSession` | accessToken, refreshToken, expiresAt |
| `AICompletion` | content, model, tokensUsed, durationMs |
| `AIModelInfo` | name, provider, maxTokens |
| `AICompletionOptions` | maxTokens?, temperature?, systemPrompt? |
| `MetricsSnapshot` | counters, histograms, timestamp |
| `UserRole` | 'super_admin' | 'admin' | 'editor' |
