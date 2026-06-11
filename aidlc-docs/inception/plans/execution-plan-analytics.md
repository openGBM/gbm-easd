# Plan de Ejecución — Analytics v2.2

## Análisis Detallado

### Alcance de Transformación
- **Tipo**: Enhancement — nueva funcionalidad sobre sistema existente (Brownfield)
- **Cambios primarios**: 2 páginas admin nuevas + componentes de gráficos
- **Complejidad**: Moderada — queries de agregación + visualización con Recharts

### Evaluación de Impacto
- **Cambios user-facing**: Sí — nuevas vistas de analytics para admin
- **Cambios estructurales**: No — se agregan páginas, no se modifica arquitectura existente
- **Cambios de modelo de datos**: No — queries sobre tablas existentes, sin tablas nuevas
- **Cambios de API**: No — operaciones directas con Supabase desde client
- **Impacto NFR**: Mínimo — queries de agregación sobre datos existentes

### Evaluación de Riesgo
- **Nivel de riesgo**: Bajo (no modifica funcionalidad existente)
- **Complejidad de rollback**: Fácil (páginas nuevas aisladas)
- **Complejidad de testing**: Simple (queries + renderizado de gráficos)

---

## Visualización del Workflow

```
INCEPTION PHASE
├── [x] Workspace Detection .............. COMPLETADO
├── [x] Requirements Analysis ............ COMPLETADO
├── [ ] User Stories ..................... OMITIDO (requerimientos claros)
├── [x] Workflow Planning ................ EN PROGRESO
├── [ ] Application Design ............... EJECUTAR (nuevos componentes)
└── [ ] Units Generation ................. OMITIDO (unidad única)

CONSTRUCTION PHASE
├── [ ] Functional Design ................ OMITIDO (no hay lógica de negocio nueva)
├── [ ] NFR Requirements ................. OMITIDO (sin NFRs nuevos)
├── [ ] NFR Design ....................... OMITIDO
├── [ ] Infrastructure Design ............ OMITIDO (sin infra nueva)
├── [ ] Code Generation .................. EJECUTAR (implementación)
├── [ ] Test Generation .................. EJECUTAR (pruebas unitarias + E2E)
└── [ ] Build and Test ................... EJECUTAR (verificación)
```

---

## Fases a Ejecutar

### 🔵 INCEPTION PHASE
- [x] Workspace Detection (COMPLETADO)
- [x] Requirements Analysis (COMPLETADO)
- [x] Workflow Planning (EN PROGRESO)
- [ ] Application Design — **EJECUTAR**
  - **Razón**: Se necesitan 5 componentes nuevos + 2 páginas nuevas + modificación de AdminNav. Definir estructura y dependencias.

### 🟢 CONSTRUCTION PHASE
- [ ] Code Generation — **EJECUTAR** (SIEMPRE)
  - **Razón**: Implementar las 2 páginas, los componentes de gráficos y las queries de agregación
- [ ] Test Generation — **EJECUTAR**
  - **Razón**: Generar pruebas unitarias (Vitest) para lógica de agregación y transformación de datos, y pruebas E2E (Playwright) para los flujos de tendencias y consolidación por usuario
- [ ] Build and Test — **EJECUTAR** (SIEMPRE)
  - **Razón**: Verificar que build pasa, ejecutar pruebas generadas y confirmar funcionamiento

### Fases Omitidas
- User Stories — **OMITIDO**: Un solo actor (admin), requerimientos claros y simples
- Units Generation — **OMITIDO**: Es una sola unidad de trabajo (analytics views)
- Functional Design — **OMITIDO**: No hay lógica de negocio nueva, solo queries de agregación y visualización
- NFR Requirements — **OMITIDO**: Sin requerimientos de performance/seguridad nuevos más allá de lo existente
- NFR Design — **OMITIDO**: No hay NFR requirements
- Infrastructure Design — **OMITIDO**: Sin infraestructura nueva (misma BD, mismo hosting)

---

## Timeline Estimado

| Fase | Duración estimada |
|------|-------------------|
| Application Design | 10 min |
| Code Generation (Planning) | 5 min |
| Code Generation (Implementation) | 45-60 min |
| Test Generation (Unit + E2E) | 30-40 min |
| Build and Test | 15 min |
| **Total** | **~2 horas** |

---

## Criterios de Éxito

- **Objetivo primario**: Dos vistas de analytics funcionales en el panel admin con cobertura de pruebas
- **Entregables**:
  - Página `/admin/instrumentos/[id]/tendencias` con gráficos de barras + filtros
  - Página `/admin/encuestados` con buscador + tabla + radares independientes
  - Navegación actualizada en AdminNav
  - Tests unitarios (Vitest): transformación de datos, cálculos de promedios, filtros
  - Tests E2E (Playwright): flujo de tendencias y flujo de consolidación por encuestado
- **Quality Gates**:
  - Gráfico de barras muestra promedios por sesión correctamente
  - Filtros de fecha y checkboxes funcionan
  - Buscador de encuestados retorna resultados por email/nombre
  - Radares individuales renderizan datos correctos por sesión
  - Build sin errores TypeScript
  - Tests unitarios pasan (Vitest)
  - Tests E2E pasan (Playwright)
