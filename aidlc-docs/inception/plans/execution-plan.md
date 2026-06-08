# Plan de Ejecución — Portal de Autodiagnóstico EA

## Resumen del Análisis

### Alcance de Transformación
- **Tipo**: Greenfield — proyecto nuevo completo
- **Cambios primarios**: Frontend (Next.js), Base de datos (Supabase), Auth
- **Complejidad**: Moderada — CRUD con visualización

### Evaluación de Impacto
- **Cambios user-facing**: Sí — portal completo de encuestas + admin panel
- **Cambios estructurales**: Sí — nueva aplicación desde cero
- **Cambios de modelo de datos**: Sí — 4 tablas nuevas
- **Cambios de API**: Sí — endpoints REST via Supabase
- **Impacto NFR**: Mínimo — MVP con seguridad básica

### Evaluación de Riesgo
- **Nivel de riesgo**: Alto (por deadline)
- **Complejidad de rollback**: Fácil (greenfield, sin sistemas existentes afectados)
- **Complejidad de testing**: Simple (CRUD + visualización)

---

## Visualización del Workflow

```
INCEPTION PHASE
├── [x] Workspace Detection .............. COMPLETADO
├── [x] Requirements Analysis ............ COMPLETADO
├── [ ] User Stories ..................... OMITIDO (deadline, requisitos claros)
├── [x] Workflow Planning ................ EN PROGRESO
├── [ ] Application Design ............... EJECUTAR (definir componentes)
└── [ ] Units Generation ................. OMITIDO (unidad única)

CONSTRUCTION PHASE
├── [ ] Functional Design ................ EJECUTAR (modelo de datos + lógica)
├── [ ] NFR Requirements ................. OMITIDO (MVP sin NFRs complejos)
├── [ ] NFR Design ....................... OMITIDO
├── [ ] Infrastructure Design ............ OMITIDO (Supabase local)
├── [ ] Code Generation .................. EJECUTAR (implementación)
└── [ ] Build and Test ................... EJECUTAR (verificación)
```

---

## Fases a Ejecutar

### 🔵 INCEPTION PHASE
- [x] Workspace Detection (COMPLETADO)
- [x] Requirements Analysis (COMPLETADO)
- [x] Workflow Planning (EN PROGRESO)
- [ ] Application Design - **EJECUTAR**
  - **Razón**: Necesario definir componentes, rutas y servicios antes de codificar

### 🟢 CONSTRUCTION PHASE
- [ ] Functional Design - **EJECUTAR**
  - **Razón**: Modelo de datos detallado, RLS policies, y lógica de negocio
- [ ] Code Generation - **EJECUTAR** (SIEMPRE)
  - **Razón**: Implementación del código completo
- [ ] Build and Test - **EJECUTAR** (SIEMPRE)
  - **Razón**: Verificar que el sistema funciona

### Fases Omitidas
- User Stories — **OMITIDO**: Requisitos ya claros del vision document, deadline ajustado
- Units Generation — **OMITIDO**: Es una sola unidad de trabajo (app monolítica con Supabase)
- NFR Requirements — **OMITIDO**: MVP sin requerimientos de performance/resiliency complejos
- NFR Design — **OMITIDO**: No hay NFR requirements
- Infrastructure Design — **OMITIDO**: Supabase local maneja toda la infra

---

## Timeline Estimado

| Fase | Duración estimada |
|------|-------------------|
| Application Design | 15 min |
| Functional Design | 20 min |
| Code Generation (Planning) | 10 min |
| Code Generation (Implementation) | 60-90 min |
| Build and Test | 20 min |
| **Total** | **~2.5 horas** |

## Criterios de Éxito
- **Objetivo primario**: Portal funcional de autodiagnóstico EA desplegado en Supabase local
- **Entregables**:
  - App Next.js con encuesta funcional
  - Gráfico de radar con Recharts
  - Panel admin con gestión de sesiones
  - Base de datos con RLS en Supabase
- **Quality Gates**:
  - Encuestado puede completar encuesta y ver resultados
  - Admin puede crear/habilitar/deshabilitar sesiones
  - Datos persistidos correctamente en Supabase
