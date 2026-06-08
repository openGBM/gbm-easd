# Diseño de Aplicación v2.x — Portal Multi-Instrumento

## Resumen

Evolución del portal para soportar múltiples instrumentos de evaluación. Se introduce el concepto de **instrumento** con **versionamiento** del banco de preguntas. La funcionalidad se activa mediante un **feature flag** compatible con Vercel Flags, garantizando retrocompatibilidad con v1.x.

---

## Principios de Diseño

1. **Feature Flag First**: Todo el código v2.x se guarda detrás del flag `multi-instrument`. Con flag off, la app se comporta exactamente como v1.x.
2. **Additive, Not Breaking**: Se agregan columnas nullable, no se eliminan ni renombran columnas existentes.
3. **Single Responsibility**: Cada servicio/componente nuevo tiene una responsabilidad clara.
4. **Retrocompatibilidad**: Las sesiones existentes (sin instrument_version_id) siguen funcionando.

---

## Feature Flag: `multi-instrument`

### Implementación con Vercel Flags

```typescript
// src/flags.ts
import { flag } from '@flags-sdk/next'
import { vercelAdapter } from '@flags-sdk/vercel'

export const multiInstrument = flag<boolean>({
  key: 'multi-instrument',
  defaultValue: false,
  adapter: vercelAdapter(),
})
```

### Comportamiento por estado del flag

| Flag OFF (v1.x) | Flag ON (v2.x) |
|------------------|-----------------|
| Dashboard muestra solo sesiones | Dashboard muestra sesiones + tarjeta de instrumentos |
| Crear sesión: solo nombre | Crear sesión: nombre + seleccionar instrumento |
| Listado sin indicador de instrumento | Listado con badge de instrumento + versión |
| Dimensiones/preguntas globales (seed) | Dimensiones/preguntas por versión de instrumento |

---

## Estructura del Proyecto (cambios v2.x)

```
src/
├── app/
│   ├── admin/
│   │   ├── page.tsx                  # AdminDashboard (+ tarjeta instrumentos si flag ON)
│   │   ├── instrumentos/            # NUEVO — solo si flag ON
│   │   │   ├── page.tsx             # InstrumentListPage (catálogo)
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # InstrumentDetailPage (versiones + dimensiones)
│   │   │       └── editar/
│   │   │           └── page.tsx     # InstrumentEditorPage (editar banco de preguntas)
│   │   └── sesiones/
│   │       └── [id]/
│   │           └── page.tsx         # (+ badge instrumento/versión)
│   └── api/
│       ├── analysis/route.ts        # Existente
│       └── flags/route.ts           # NUEVO — Flags discovery endpoint
├── components/
│   ├── InstrumentBadge.tsx           # NUEVO — Badge tipo + versión
│   ├── InstrumentSelector.tsx        # NUEVO — Selector al crear sesión
│   └── ...                           # Existentes sin cambios
├── flags.ts                          # NUEVO — Definición de feature flags
├── lib/
│   └── supabase/
│       └── ...                       # Sin cambios
└── types/
    └── database.ts                   # + tipos Instrument, InstrumentVersion
```

---

## Modelo de Datos v2.x

### Nuevas Tablas

#### instruments
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | uuid | PK, auto-gen | Identificador único |
| name | text | NOT NULL | Nombre del instrumento |
| description | text | | Descripción del instrumento |
| is_active | boolean | DEFAULT true | Si está disponible para nuevas sesiones |
| created_at | timestamptz | DEFAULT now() | Fecha de creación |

**Seed**: Un instrumento por defecto "Autodiagnóstico de Arquitectura Empresarial"

#### instrument_versions
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | uuid | PK, auto-gen | Identificador único |
| instrument_id | uuid | FK → instruments.id, NOT NULL | Instrumento padre |
| version_number | integer | NOT NULL | Número de versión (incremental) |
| is_current | boolean | DEFAULT false | Si es la versión activa |
| created_at | timestamptz | DEFAULT now() | Fecha de creación |
| notes | text | | Notas del cambio de versión |

**Constraints**: UNIQUE (instrument_id, version_number)

### Modificaciones a Tablas Existentes

#### sessions (agregar columna)
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| instrument_version_id | uuid | FK → instrument_versions.id, **NULLABLE** | Versión del instrumento aplicada |

**Nullable** para retrocompatibilidad: sesiones v1.x no tendrán este valor.

#### dimensions (agregar columna)
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| instrument_version_id | uuid | FK → instrument_versions.id, **NULLABLE** | Versión a la que pertenece |

**Nullable** para retrocompatibilidad: dimensiones v1.x (seed) no tendrán este valor y se consideran del instrumento default.

---

## Diagrama de Relaciones v2.x

```
instruments (1) ──── (N) instrument_versions (1) ──┬── (N) sessions
                                                   │
                                                   └── (N) dimensions (1) ──── (N) questions
                                                              
sessions (1) ──── (N) respondents (1) ──── (N) responses
```

---

## Componentes Nuevos

### InstrumentListPage (`/admin/instrumentos`)
- **Propósito**: Catálogo de instrumentos disponibles
- **Responsabilidades**:
  - Listar instrumentos con nombre, descripción, versión actual, sesiones asociadas
  - Crear nuevo instrumento
  - Activar/desactivar instrumentos
- **Renderizado**: Client
- **Condición**: Solo visible si flag `multi-instrument` = ON

### InstrumentDetailPage (`/admin/instrumentos/[id]`)
- **Propósito**: Detalle de un instrumento con historial de versiones
- **Responsabilidades**:
  - Mostrar info del instrumento
  - Listar versiones (historial) con fecha y notas
  - Ver dimensiones/preguntas de cada versión
  - Botón para crear nueva versión (editar banco)
- **Renderizado**: Client
- **Condición**: Solo visible si flag `multi-instrument` = ON

### InstrumentEditorPage (`/admin/instrumentos/[id]/editar`)
- **Propósito**: Editor del banco de dimensiones y preguntas
- **Responsabilidades**:
  - Mostrar dimensiones actuales con preguntas editables
  - Agregar/eliminar dimensiones
  - Agregar/eliminar/editar preguntas
  - Al guardar: crea nueva versión del instrumento con el banco actualizado
- **Renderizado**: Client
- **Condición**: Solo visible si flag `multi-instrument` = ON

### InstrumentBadge (Componente)
- **Propósito**: Badge visual que indica tipo de instrumento y versión
- **Props**: instrumentName, versionNumber
- **Uso**: En listado de sesiones y detalle de sesión
- **Condición**: Solo renderiza si flag `multi-instrument` = ON

### InstrumentSelector (Componente)
- **Propósito**: Selector de instrumento al crear sesión
- **Props**: instruments[], onSelect
- **Uso**: En formulario de crear sesión del AdminDashboard
- **Condición**: Solo renderiza si flag `multi-instrument` = ON

---

## Servicios Nuevos

### InstrumentService
- **Propósito**: Gestionar el ciclo de vida de instrumentos
- **Operaciones**:
  - `getAll()` — listar instrumentos activos
  - `getById(id)` — obtener instrumento con versión actual
  - `create(name, description)` — crear nuevo instrumento
  - `toggleActive(id)` — activar/desactivar
- **Tabla**: `instruments`

### InstrumentVersionService
- **Propósito**: Gestionar versiones de un instrumento
- **Operaciones**:
  - `getVersions(instrumentId)` — historial de versiones
  - `getCurrentVersion(instrumentId)` — versión activa
  - `hasResponses(versionId)` — verificar si la versión tiene sesiones con respondents completados
  - `saveBank(instrumentId, dimensions, questions, notes)` — guardar banco de preguntas
    - Si la versión current NO tiene respuestas: editar dimensiones/preguntas in-place
    - Si la versión current SÍ tiene respuestas: crear nueva versión, duplicar banco y aplicar cambios
    - Marcar nueva versión como `is_current = true`
- **Tablas**: `instrument_versions`, `dimensions`, `questions`, `sessions`, `respondents`

---

## Lógica de Negocio Condicional (flag-dependent)

### Crear Sesión
```
IF flag ON:
  1. Admin selecciona instrumento del catálogo
  2. Sistema obtiene versión actual del instrumento
  3. Crea sesión con instrument_version_id = versión actual
ELSE:
  1. Admin ingresa solo el nombre
  2. Crea sesión sin instrument_version_id (null — comportamiento v1.x)
```

### Cargar Encuesta
```
IF sesión tiene instrument_version_id:
  1. Cargar dimensiones WHERE instrument_version_id = sesión.instrument_version_id
ELSE:
  1. Cargar dimensiones WHERE instrument_version_id IS NULL (dimensiones seed v1.x)
```

### Dashboard Global
```
IF flag ON:
  Mostrar tarjeta adicional: "Instrumentos Disponibles" (count de instruments activos)
ELSE:
  No mostrar tarjeta de instrumentos
```

### Listado de Sesiones
```
IF flag ON:
  Mostrar InstrumentBadge con nombre del instrumento y versión aplicada
ELSE:
  No mostrar badge
```

---

## Migración de Datos

### Estrategia: Seed automático + nullable

1. Crear tabla `instruments` con un registro seed:
   - name: "Autodiagnóstico de Arquitectura Empresarial"
   - description: "Evaluación de madurez EA basada en EA in a Box 2.0"

2. Crear tabla `instrument_versions` con una versión seed:
   - instrument_id: el instrumento seed
   - version_number: 1
   - is_current: true

3. Agregar `instrument_version_id` (nullable) a `sessions` y `dimensions`

4. **NO migrar datos existentes obligatoriamente** — las sesiones sin `instrument_version_id` funcionan con lógica v1.x (dimensiones globales)

5. Opcionalmente (script de migración): asociar dimensiones existentes a la versión 1 del instrumento seed

---

## Seguridad (RLS)

### instruments
- SELECT: público (para mostrar en selector al crear sesión)
- INSERT/UPDATE/DELETE: solo admin autenticado

### instrument_versions
- SELECT: público (para cargar dimensiones de la versión correcta)
- INSERT/UPDATE: solo admin autenticado

---

## API Endpoints

| Ruta | Método | Descripción | Condición |
|------|--------|-------------|-----------|
| `/api/analysis` | POST | Análisis IA (existente) | Siempre |
| `/api/flags` | GET | Flags discovery endpoint (Vercel Toolbar) | Siempre |

---

## Dependencias Nuevas

| Paquete | Propósito |
|---------|-----------|
| `@flags-sdk/next` | Feature flags para Next.js |
| `@flags-sdk/vercel` | Adaptador para Vercel Flags Dashboard |

---

## Plan de Implementación

| Paso | Descripción | Prioridad |
|------|-------------|-----------|
| 1 | Instalar @flags-sdk/next + @flags-sdk/vercel, crear flags.ts | Alta |
| 2 | Crear flag `multi-instrument` en Vercel Dashboard | Alta |
| 3 | Migración BD: tablas instruments + instrument_versions + columnas | Alta |
| 4 | Seed: instrumento EA + versión 1 | Alta |
| 5 | InstrumentBadge + InstrumentSelector components | Media |
| 6 | Modificar AdminDashboard: tarjeta instrumentos (condicional) | Media |
| 7 | Modificar crear sesión: selector de instrumento (condicional) | Media |
| 8 | InstrumentListPage + InstrumentDetailPage | Media |
| 9 | InstrumentEditorPage (crear nueva versión) | Media |
| 10 | Modificar carga de encuesta: dimensiones por versión | Media |
| 11 | Tests con flag ON y flag OFF | Alta |
