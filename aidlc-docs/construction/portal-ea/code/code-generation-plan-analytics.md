# Plan de Code Generation — Analytics v2.2

## Pasos de Implementación

- [x] 1. Crear funciones puras de transformación (`lib/analytics/`)
  - [x] 1.1 `transformTrendData.ts` — transforma datos raw de tendencias
  - [x] 1.2 `transformRespondentHistory.ts` — transforma historial de encuestado
  - [x] 1.3 `filterTrendData.ts` — aplica filtros de fecha y sesiones

- [x] 2. Crear componentes de Tendencias
  - [x] 2.1 `TrendBarChart.tsx` — gráfico de barras (general + por dimensión)
  - [x] 2.2 `TrendTable.tsx` — tabla de datos debajo del gráfico
  - [x] 2.3 `TrendFilters.tsx` — filtros de fecha y checkboxes de sesiones

- [x] 3. Crear componentes de Encuestados
  - [x] 3.1 `RespondentSearchBar.tsx` — buscador por email/nombre
  - [x] 3.2 `RespondentHistoryTable.tsx` — tabla cronológica
  - [x] 3.3 `RespondentRadarGrid.tsx` — grid de radares independientes

- [x] 4. Crear páginas
  - [x] 4.1 `/admin/instrumentos/[id]/tendencias/page.tsx` — TendenciasPage
  - [x] 4.2 `/admin/encuestados/page.tsx` — EncuestadosPage

- [x] 5. Modificar componentes existentes
  - [x] 5.1 `AdminNav.tsx` — agregar enlace "Encuestados"
  - [x] 5.2 `instrumentos/page.tsx` — agregar botón "📊 Tendencias" por instrumento

- [x] 6. Build y verificación
  - [x] 6.1 `tsc --noEmit` sin errores TypeScript
