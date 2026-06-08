# Entidades de Dominio — Portal EA

## Diagrama de Relaciones

```
sessions (1) ──── (N) respondents (1) ──── (N) responses
                                                    │
dimensions (1) ─────────────────────────────────── (N)
```

---

## Session (Sesión de Encuesta)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | uuid | PK, auto-gen | Identificador único |
| name | text | NOT NULL | Nombre descriptivo de la sesión |
| is_active | boolean | DEFAULT true | Si la sesión acepta respuestas |
| created_at | timestamptz | DEFAULT now() | Fecha de creación |

**Reglas de negocio**:
- Una sesión inactiva no acepta nuevos encuestados ni respuestas
- El admin puede reactivar una sesión previamente deshabilitada
- Cada sesión tiene un URL único: `/encuesta/{session_id}`

---

## Respondent (Encuestado)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | uuid | PK, auto-gen | Identificador único |
| session_id | uuid | FK → sessions.id, NOT NULL | Sesión a la que pertenece |
| name | text | NOT NULL | Nombre del encuestado |
| email | text | NOT NULL | Correo del encuestado |
| completed | boolean | DEFAULT false | Si completó todas las dimensiones |
| created_at | timestamptz | DEFAULT now() | Fecha de registro |

**Reglas de negocio**:
- Un encuestado se registra una sola vez por sesión (validar email único por sesión)
- Solo puede registrarse si la sesión está activa
- Se marca como `completed` al enviar todas las respuestas

---

## Dimension (Dimensión de Evaluación EA)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | uuid | PK, auto-gen | Identificador único |
| name | text | NOT NULL | Nombre de la dimensión |
| description | text | | Descripción/explicación de la dimensión |
| display_order | integer | NOT NULL, UNIQUE | Orden de presentación en el wizard |

**Reglas de negocio**:
- Las dimensiones son estáticas (seed data del PDF)
- 8-10 dimensiones predefinidas
- El orden determina la secuencia del wizard

---

## Response (Respuesta)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | uuid | PK, auto-gen | Identificador único |
| respondent_id | uuid | FK → respondents.id, NOT NULL | Quién respondió |
| dimension_id | uuid | FK → dimensions.id, NOT NULL | Qué dimensión |
| value | integer | NOT NULL, CHECK (1-5) | Valor seleccionado |
| created_at | timestamptz | DEFAULT now() | Fecha de respuesta |

**Restricciones compuestas**:
- UNIQUE (respondent_id, dimension_id) — una respuesta por dimensión por encuestado

**Reglas de negocio**:
- Valor entre 1 y 5 (escala Likert)
- Se guardan todas las respuestas en batch al completar el wizard
- No se pueden modificar después de enviar
