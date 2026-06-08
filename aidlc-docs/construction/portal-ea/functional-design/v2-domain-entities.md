# Entidades de Dominio v2.x — Multi-Instrumento

## Diagrama de Relaciones

```
instruments (1) ──── (N) instrument_versions (1) ──┬── (N) sessions
                                                   │
                                                   └── (N) dimensions (1) ──── (N) questions

sessions (1) ──── (N) respondents (1) ──── (N) responses

sessions (1) ──── (0..1) session_analyses
```

---

## Instrument (Instrumento de Evaluación)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | uuid | PK, auto-gen | Identificador único |
| name | text | NOT NULL | Nombre del instrumento |
| description | text | | Descripción/propósito del instrumento |
| is_active | boolean | DEFAULT true | Si está disponible para nuevas sesiones |
| created_at | timestamptz | DEFAULT now() | Fecha de creación |

**Reglas de negocio**:
- Un instrumento inactivo no aparece en el selector al crear sesiones
- El instrumento seed "Autodiagnóstico de Arquitectura Empresarial" no se puede eliminar
- Solo admins pueden crear/editar instrumentos

---

## InstrumentVersion (Versión del Banco de Preguntas)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | uuid | PK, auto-gen | Identificador único |
| instrument_id | uuid | FK → instruments.id, NOT NULL | Instrumento padre |
| version_number | integer | NOT NULL | Número incremental de versión |
| is_current | boolean | DEFAULT false | Si es la versión activa para nuevas sesiones |
| notes | text | | Notas sobre qué cambió en esta versión |
| created_at | timestamptz | DEFAULT now() | Fecha de creación |

**Constraints**: UNIQUE (instrument_id, version_number)

**Reglas de negocio**:
- Solo una versión por instrumento puede ser `is_current = true`
- Al crear nueva versión, se desmarca la anterior como current
- Las versiones no se pueden eliminar si hay sesiones asociadas
- El version_number se auto-incrementa (max + 1)

---

## Cambios a Session (v2.x)

| Campo nuevo | Tipo | Restricciones | Descripción |
|-------------|------|---------------|-------------|
| instrument_version_id | uuid | FK → instrument_versions.id, **NULLABLE** | Versión del instrumento aplicada |

**Reglas de negocio**:
- Si `instrument_version_id` es NULL → sesión v1.x (usa dimensiones seed globales)
- Si tiene valor → carga dimensiones de esa versión específica
- Una vez creada, no se puede cambiar el instrumento/versión de una sesión

---

## Cambios a Dimension (v2.x)

| Campo nuevo | Tipo | Restricciones | Descripción |
|-------------|------|---------------|-------------|
| instrument_version_id | uuid | FK → instrument_versions.id, **NULLABLE** | Versión a la que pertenece |

**Reglas de negocio**:
- Si `instrument_version_id` es NULL → dimensión v1.x (seed global, usada cuando sesión no tiene versión)
- Si tiene valor → pertenece a esa versión específica del instrumento
- Al crear nueva versión, se duplican las dimensiones y preguntas de la versión anterior como base editable

---

## Tabla de Compatibilidad

| Escenario | instrument_version_id en session | Dimensiones usadas |
|-----------|-----------------------------------|--------------------|
| Sesión v1.x (existente) | NULL | dimensions WHERE instrument_version_id IS NULL |
| Sesión v2.x (nueva) | uuid de versión | dimensions WHERE instrument_version_id = valor |
| Flag OFF + sesión nueva | NULL | dimensions WHERE instrument_version_id IS NULL |
| Flag ON + sesión nueva | uuid (admin elige) | dimensions WHERE instrument_version_id = valor |
