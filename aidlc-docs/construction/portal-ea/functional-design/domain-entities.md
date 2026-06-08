# Entidades de Dominio — Portal EA

## Diagrama de Relaciones

```
sessions (1) ──── (N) respondents (1) ──── (N) responses
                                                    │
dimensions (1) ──── (N) questions (1) ──────────── (N)
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
| completed_at | timestamptz | DEFAULT NULL | Fecha/hora en que completó la evaluación |
| created_at | timestamptz | DEFAULT now() | Fecha de registro |

**Reglas de negocio**:
- Un encuestado se registra una sola vez por sesión (validar email único por sesión)
- Solo puede registrarse si la sesión está activa
- Se marca como `completed` al enviar todas las respuestas
- `completed_at` se establece al momento de enviar (permite calcular tiempo de respuesta)

---

## Dimension (Dimensión de Evaluación EA)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | uuid | PK, auto-gen | Identificador único |
| name | text | NOT NULL | Nombre de la dimensión |
| description | text | | Descripción/explicación de la dimensión |
| display_order | integer | NOT NULL, UNIQUE | Orden de presentación en el wizard |
| color | text | | Color hex para UI (ej: #2563EB) |

**Reglas de negocio**:
- Las dimensiones son estáticas (seed data del PDF)
- 8 dimensiones predefinidas con 6 preguntas cada una
- El orden determina la secuencia del wizard
- El color se usa para la barra de progreso y botones del wizard

---

## Question (Pregunta por Dimensión)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | uuid | PK, auto-gen | Identificador único |
| dimension_id | uuid | FK → dimensions.id, NOT NULL | Dimensión a la que pertenece |
| text | text | NOT NULL | Texto de la pregunta/afirmación |
| display_order | integer | NOT NULL | Orden dentro de la dimensión |

**Reglas de negocio**:
- Cada dimensión tiene 6 preguntas (afirmaciones a evaluar)
- Las preguntas son estáticas (seed data)
- El orden determina la secuencia de presentación dentro del paso del wizard

---

## Response (Respuesta)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | uuid | PK, auto-gen | Identificador único |
| respondent_id | uuid | FK → respondents.id, NOT NULL | Quién respondió |
| question_id | uuid | FK → questions.id, NOT NULL | Qué pregunta |
| value | integer | NOT NULL, CHECK (1-5) | Valor seleccionado |
| created_at | timestamptz | DEFAULT now() | Fecha de respuesta |

**Restricciones compuestas**:
- UNIQUE (respondent_id, question_id) — una respuesta por pregunta por encuestado

**Reglas de negocio**:
- Valor entre 1 y 5 (escala de acuerdo)
- Se guardan todas las respuestas mediante upsert al completar el wizard
- Permite reanudación: si el encuestado se registró pero no completó, sus respuestas previas se cargan y puede continuar
