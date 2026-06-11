# Diseño de Aplicación — Analytics v2.2

## Resumen

Extensión del panel admin con 2 páginas nuevas de analytics y 5 componentes de visualización. No requiere cambios en el modelo de datos ni servicios nuevos — opera con queries de agregación sobre las tablas existentes.

---

## Nuevas Páginas

### `/admin/instrumentos/[id]/tendencias` — TendenciasPage

**Tipo**: Client component  
**Propósito**: Visualizar la evolución de resultados de un instrumento a través de sus sesiones  
**Responsabilidades**:
- Cargar todas las sesiones del instrumento con datos de respuestas agregados
- Calcular promedio general y promedio por dimensión para cada sesión
- Renderizar gráfico de barras (promedio general) y gráfico de barras agrupadas (por dimensión)
- Implementar filtros: rango de fechas (desde/hasta) y checkboxes de sesiones
- Mostrar tabla de datos debajo de los gráficos
- Verificar autenticación (redirect a login si no auth)

### `/admin/encuestados` — EncuestadosPage

**Tipo**: Client component  
**Propósito**: Buscar encuestados y ver su historial consolidado en múltiples sesiones  
**Responsabilidades**:
- Buscador por email o nombre (búsqueda con ILIKE)
- Mostrar lista de encuestados encontrados con count de sesiones
- Al seleccionar un encuestado: cargar historial completo
- Renderizar tabla cronológica de participaciones
- Renderizar grid de radares independientes (uno por sesión)
- Verificar autenticación (redirect a login si no auth)

---

## Nuevos Componentes

### TrendBarChart

**Propósito**: Gráfico de barras para visualizar tendencias  
**Props**:
```typescript
interface TrendBarChartProps {
  data: TrendDataPoint[]       // Datos transformados (genéricos, no acoplados a escala)
  type: 'general' | 'byDimension'
  dimensions?: DimensionInfo[] // Solo para type='byDimension'
}

interface TrendDataPoint {
  sessionName: string
  sessionDate: string
  generalAvg?: number          // Para type='general'
  dimensionAvgs?: Record<string, number>  // Para type='byDimension'
}

interface DimensionInfo {
  name: string
  color: string
}
```
**Librería**: Recharts (BarChart, Bar, XAxis, YAxis, Tooltip, Legend)

### TrendTable

**Propósito**: Tabla de datos de tendencias debajo de los gráficos  
**Props**:
```typescript
interface TrendTableProps {
  data: TrendDataPoint[]
  dimensions: DimensionInfo[]
}
```

### TrendFilters

**Propósito**: Controles de filtro para la vista de tendencias  
**Props**:
```typescript
interface TrendFiltersProps {
  sessions: { id: string; name: string; date: string }[]
  dateRange: { from: string | null; to: string | null }
  selectedSessions: Set<string>
  onDateRangeChange: (range: { from: string | null; to: string | null }) => void
  onSessionToggle: (sessionId: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}
```

### RespondentSearchBar

**Propósito**: Buscador de encuestados por email/nombre  
**Props**:
```typescript
interface RespondentSearchBarProps {
  onSearch: (query: string) => void
  loading: boolean
}
```

### RespondentHistoryTable

**Propósito**: Tabla cronológica de sesiones del encuestado  
**Props**:
```typescript
interface RespondentHistoryTableProps {
  history: RespondentSession[]
}

interface RespondentSession {
  sessionId: string
  sessionName: string
  date: string
  totalScore: number
  maxScore: number
  maturityLevel: string
  maturityColor: string
}
```

### RespondentRadarGrid

**Propósito**: Grid de gráficos de radar independientes (uno por sesión)  
**Props**:
```typescript
interface RespondentRadarGridProps {
  sessions: RespondentRadarData[]
}

interface RespondentRadarData {
  sessionName: string
  date: string
  data: { dimension: string; value: number }[]  // Interfaz genérica — misma que RadarChart existente
}
```
**Nota**: Reutiliza el componente `RadarChart` existente internamente.

---

## Funciones de Transformación de Datos (funciones puras)

### `transformTrendData`

```typescript
// Transforma datos raw de Supabase a formato genérico para gráficos
function transformTrendData(
  rawData: RawTrendRow[]
): { general: TrendDataPoint[]; byDimension: TrendDataPoint[]; dimensions: DimensionInfo[] }
```

### `transformRespondentHistory`

```typescript
// Transforma datos raw de historial a formato de tabla + radares
function transformRespondentHistory(
  rawData: RawHistoryRow[]
): { table: RespondentSession[]; radars: RespondentRadarData[] }
```

### `filterTrendData`

```typescript
// Aplica filtros de fecha y sesiones seleccionadas
function filterTrendData(
  data: TrendDataPoint[],
  dateRange: { from: string | null; to: string | null },
  selectedSessions: Set<string>
): TrendDataPoint[]
```

**Principio RNF-A04**: Estas funciones son puras, reciben datos ya consultados, y retornan estructuras genéricas. Cuando se agreguen tipos de pregunta no numéricos, solo se ajusta la query (filtrar por tipo) — los componentes y transformadores no cambian.

---

## Modificaciones a Componentes Existentes

### AdminNav
- Agregar enlace "Encuestados" (`/admin/encuestados`) en la navegación

### AdminDashboard (o lista de instrumentos)
- Agregar botón/enlace "📊 Tendencias" por cada instrumento que lleve a `/admin/instrumentos/[id]/tendencias`

---

## Diagrama de Dependencias

```
TendenciasPage
├── TrendFilters
├── TrendBarChart (×2: general + byDimension)
├── TrendTable
└── transformTrendData(), filterTrendData()

EncuestadosPage
├── RespondentSearchBar
├── RespondentHistoryTable
├── RespondentRadarGrid
│   └── RadarChart (existente, ×N)
└── transformRespondentHistory()
```

---

## Estructura de Archivos Nuevos

```
src/
├── app/admin/
│   ├── instrumentos/[id]/tendencias/
│   │   └── page.tsx              # TendenciasPage
│   └── encuestados/
│       └── page.tsx              # EncuestadosPage
├── components/
│   ├── TrendBarChart.tsx
│   ├── TrendTable.tsx
│   ├── TrendFilters.tsx
│   ├── RespondentSearchBar.tsx
│   ├── RespondentHistoryTable.tsx
│   └── RespondentRadarGrid.tsx
└── lib/
    └── analytics/
        ├── transformTrendData.ts
        ├── transformRespondentHistory.ts
        └── filterTrendData.ts
```
