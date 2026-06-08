# Portal de Gestión de Evaluaciones de Autodiagnóstico — GBM

## Visión General

El objetivo es construir un **portal de gestión de evaluaciones de autodiagnóstico** que permite aplicar distintos tipos de instrumentos de evaluación a clientes GBM. El portal es genérico, multi-instrumento y extensible.

## Evolución del Producto

| Fase | Alcance |
|------|---------|
| v1.x (actual) | Un único instrumento: Autodiagnóstico de Arquitectura Empresarial (EA in a Box) |
| v2.x (próxima) | Multi-instrumento: el admin gestiona distintos tipos de instrumentos, cada uno con su banco de dimensiones y preguntas versionado |

## Concepto Clave: Instrumento

Un **instrumento** es un tipo de evaluación con:
- Un nombre y descripción
- Un banco de dimensiones con preguntas asociadas
- Un historial de versiones del banco (cada modificación genera una nueva versión)
- Una escala de evaluación (por defecto 1-5, configurable a futuro)

Cada **sesión** se asocia a un instrumento específico y a una versión puntual del banco de preguntas. Esto garantiza que los resultados de una sesión siempre se interpretan contra la versión exacta del instrumento que se aplicó.

## Principios de Diseño

1. **Feature Flag**: La funcionalidad multi-instrumento se gestiona mediante feature flags compatibles con [Vercel Flags](https://vercel.com/docs/flags). Mientras el flag esté desactivado, el portal opera como v1.x (instrumento único de EA). Al activarlo, se habilita la gestión de múltiples instrumentos.

2. **Retrocompatibilidad**: El instrumento de "Autodiagnóstico de Arquitectura Empresarial" es el instrumento por defecto (seed). Las sesiones existentes se asocian a este instrumento automáticamente.

3. **Versionamiento**: Cada modificación al banco de dimensiones/preguntas de un instrumento crea una nueva versión. Las sesiones quedan ligadas a la versión con la que fueron creadas.

4. **Extensibilidad**: A futuro se podrán agregar instrumentos con diferentes estructuras (distinto número de dimensiones, preguntas, escalas).

## Funcionalidades de la Nueva Visión (v2.x)

### Para el Admin
- Catálogo de instrumentos disponibles
- Crear/editar instrumentos con sus dimensiones y preguntas
- Versionamiento automático del banco de preguntas
- Al crear sesión, seleccionar qué instrumento aplicar
- Indicador del tipo de instrumento y versión en listado de sesiones
- Tarjeta adicional en dashboard global: cantidad de instrumentos disponibles
- Administrar dimensiones y banco de preguntas por instrumento

### Para el Encuestado
- Experiencia transparente (no cambia — responde el instrumento que le corresponde)
- Cada sesión aplica un único instrumento en una versión fija

## Modelo de Datos Conceptual (v2.x)

```
instruments (1) ──── (N) instrument_versions (1) ──── (N) sessions
                                    │
                                    └──── (N) dimensions (1) ──── (N) questions
```

### Nuevas Entidades
- **instruments**: id, name, description, is_active, created_at
- **instrument_versions**: id, instrument_id, version_number, is_current, created_at
- **dimensions**: se vincula a instrument_version_id (en lugar de ser global)
- **questions**: se mantiene vinculada a dimension_id

### Cambios a Entidades Existentes
- **sessions**: agrega instrument_version_id (FK → instrument_versions)

## Feature Flags (Vercel Flags)

| Flag | Tipo | Descripción |
|------|------|-------------|
| `multi-instrument` | boolean | Habilita la gestión multi-instrumento. Off = comportamiento v1.x (solo EA) |

### Implementación
- Se utiliza `@flags-sdk/vercel` para integración nativa con Vercel Dashboard
- El flag se define en código y se gestiona desde Vercel Dashboard
- En desarrollo local se puede override vía Vercel Toolbar o `.env.local`

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| UI | React 19 + Tailwind CSS 4 |
| Visualización | Recharts (radar chart) |
| QR | qrcode.react |
| Exportación | ExcelJS |
| IA/Análisis | Google Gemini 2.0 Flash + Groq Llama 3.3 70B (fallback) |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Supabase Auth (email/password) |
| Feature Flags | Vercel Flags (@flags-sdk/vercel) |
| Despliegue | Vercel (producción), Supabase Cloud (BD) |

## Contexto Original (v1.x)

El portal permite evaluar la madurez y eficacia de la Arquitectura Empresarial de clientes GBM mediante el instrumento "EA in a Box 2.0" (8 dimensiones, 48 preguntas, escala de acuerdo 1-5). Al finalizar se construye un gráfico de radar y una tabla resumen con niveles de madurez (Naciente / Base / Clase Mundial). Un agente IA genera un análisis interpretativo bajo demanda del admin.
