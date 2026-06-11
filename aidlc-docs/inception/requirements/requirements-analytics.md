# Requerimientos — Analytics v2.2

## Análisis de Intención

- **Solicitud del usuario**: Agregar analytics al portal con dos vistas: tendencias por instrumento y consolidación por usuario
- **Tipo de proyecto**: Enhancement (nueva funcionalidad sobre sistema existente)
- **Estimación de alcance**: Múltiples componentes (2 páginas nuevas + componentes de gráficos)
- **Complejidad**: Moderada — queries de agregación sobre datos existentes + visualización

---

## Requerimientos Funcionales

### RF-A01: Vista de Tendencias por Instrumento

- Nueva página dedicada: `/admin/instrumentos/[id]/tendencias`
- Muestra la evolución de resultados de todas las sesiones de un instrumento en el tiempo
- Dos visualizaciones:
  - **Gráfico de barras agrupadas — Promedio General**: Una barra por sesión (eje X = sesiones ordenadas por fecha, eje Y = promedio general 1-5)
  - **Gráfico de barras agrupadas — Por Dimensión**: Un grupo de barras por sesión, una barra por dimensión (con colores de dimensión)
- Debajo de los gráficos: tabla de datos con valores numéricos
- **Filtros**:
  - Filtro por rango de fechas (desde/hasta)
  - Filtro por sesiones específicas (checkboxes para incluir/excluir sesiones)
- Solo se consideran encuestados con `completed = true`
- Solo accesible por admin autenticado

### RF-A02: Vista de Consolidación por Encuestado

- Nueva página dedicada: `/admin/encuestados`
- Buscador por email o nombre para encontrar encuestados
- Al seleccionar un encuestado (identificado por email exacto), mostrar:
  - **Tabla cronológica**: sesión | instrumento | fecha | puntaje global | nivel de madurez
  - **Radares independientes**: Un gráfico de radar por cada sesión en la que participó (NO superpuestos), ordenados cronológicamente
- Cada radar muestra el promedio por dimensión de esa sesión específica
- Solo se muestran sesiones donde el encuestado tiene `completed = true`
- Solo accesible por admin autenticado

### RF-A03: Navegación a Analytics

- Agregar enlace a "Tendencias" desde la lista de instrumentos en el admin
- Agregar enlace a "Encuestados" en la navegación del panel admin (AdminNav)

---

## Requerimientos No Funcionales

### RNF-A01: Rendimiento
- Las queries de agregación deben ejecutar en < 2 segundos para hasta 50 sesiones × 100 encuestados
- Gráficos renderizados client-side con Recharts (misma librería del proyecto)

### RNF-A02: Idioma
- Toda la interfaz en español (labels, tooltips, filtros)
- Formato de fechas: es-MX (dd/mm/yyyy)

### RNF-A03: Responsividad
- Vistas optimizadas para desktop (uso admin)
- Gráficos responsivos (ResponsiveContainer de Recharts)

### RNF-A04: Extensibilidad para tipos de respuesta futuros
- La lógica de agregación y gráficos de tendencias debe aislarse en funciones puras que reciban datos ya transformados (no acoplarse a la escala 1-5 actual)
- Diseñar los componentes de gráficos para recibir datos genéricos (`{ label: string, value: number }[]`)
- Cuando se agreguen tipos de respuesta no numéricos (texto libre, boolean), las tendencias solo incluirán preguntas con valor numérico agregable
- Prever un filtro o indicador de "tipo de pregunta" para que el sistema pueda excluir preguntas no graficables en futuras versiones
- No implementar soporte multi-tipo ahora, solo asegurar que la arquitectura no bloquee la evolución

---

## Modelo de Datos

### Queries necesarias (no requieren nuevas tablas)

**Tendencias por instrumento:**
```sql
-- Obtener todas las sesiones de un instrumento con promedios
SELECT s.id, s.name, s.created_at,
       d.name as dimension_name, d.display_order, d.color,
       AVG(r.value) as avg_value
FROM sessions s
JOIN respondents resp ON resp.session_id = s.id AND resp.completed = true
JOIN responses r ON r.respondent_id = resp.id
JOIN questions q ON q.id = r.question_id
JOIN dimensions d ON d.id = q.dimension_id
WHERE s.instrument_id = :instrumentId  -- (si multi-instrumento está activo)
GROUP BY s.id, s.name, s.created_at, d.name, d.display_order, d.color
ORDER BY s.created_at ASC, d.display_order ASC
```

**Consolidación por encuestado:**
```sql
-- Buscar encuestado por email
SELECT DISTINCT email, name FROM respondents WHERE email ILIKE :search OR name ILIKE :search

-- Historial de un encuestado
SELECT s.id, s.name as session_name, s.created_at,
       d.name as dimension_name, d.display_order, d.color,
       AVG(r.value) as avg_value,
       SUM(r.value) as total_value
FROM respondents resp
JOIN sessions s ON s.id = resp.session_id
JOIN responses r ON r.respondent_id = resp.id
JOIN questions q ON q.id = r.question_id
JOIN dimensions d ON d.id = q.dimension_id
WHERE resp.email = :email AND resp.completed = true
GROUP BY s.id, s.name, s.created_at, d.name, d.display_order, d.color
ORDER BY s.created_at ASC, d.display_order ASC
```

---

## Nuevas Rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/admin/instrumentos/[id]/tendencias` | Protegido (admin) | Tendencias de un instrumento |
| `/admin/encuestados` | Protegido (admin) | Buscador y consolidación por encuestado |

---

## Nuevos Componentes

| Componente | Propósito |
|------------|-----------|
| TrendChart | Gráfico de barras agrupadas para tendencias (Recharts BarChart) |
| TrendTable | Tabla de datos de tendencias debajo de los gráficos |
| RespondentSearchBar | Buscador de encuestados por email/nombre |
| RespondentHistoryTable | Tabla cronológica de sesiones del encuestado |
| RespondentRadarGrid | Grid de radares independientes (uno por sesión) |

---

## Dependencias

- No se requieren nuevas dependencias (Recharts ya instalado)
- Reutilizar componente `RadarChart` existente para los radares individuales

---

## Alcance — IN

| Feature | Vista |
|---------|-------|
| Gráfico de barras: promedio general por sesión | Tendencias |
| Gráfico de barras: promedio por dimensión por sesión | Tendencias |
| Tabla de datos debajo de gráficos | Tendencias |
| Filtro por rango de fechas | Tendencias |
| Filtro por sesiones específicas (checkboxes) | Tendencias |
| Buscador de encuestados por email/nombre | Encuestados |
| Tabla cronológica: sesión, fecha, puntaje, nivel | Encuestados |
| Radares independientes por sesión del encuestado | Encuestados |
| Navegación desde admin a ambas vistas | Ambas |

## Alcance — OUT

| Feature | Razón |
|---------|-------|
| Exportación de datos de tendencias | Fase futura |
| Comparación entre instrumentos | Fuera de scope |
| Alertas automáticas por cambios en tendencia | Fase futura |
| Vista pública para el encuestado de su propio historial | Solo admin (Q8=A) |
| Administración de usuarios del sistema (roles, permisos) | Fuera de scope — feature distinta |

