-- v2.0: Tipos de pregunta variados + opcionalidad
-- Agrega type, contributes_to_score e is_required a questions
-- Agrega text_value a responses para respuestas de texto libre

-- Nuevos campos en questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'likert';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS contributes_to_score boolean NOT NULL DEFAULT true;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_required boolean NOT NULL DEFAULT true;

-- Constraint para validar tipos permitidos
ALTER TABLE questions ADD CONSTRAINT chk_question_type 
  CHECK (type IN ('likert', 'boolean', 'text'));

-- Respuestas de texto libre
ALTER TABLE responses ADD COLUMN IF NOT EXISTS text_value text;

-- Relajar constraint de value para permitir NULL en preguntas de texto
-- (text: value=NULL, text_value='respuesta')
-- (boolean: value=0 o 1)
-- (likert: value=1-5)
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_value_check;
ALTER TABLE responses ADD CONSTRAINT responses_value_check 
  CHECK (
    (text_value IS NOT NULL AND value IS NULL) OR  -- pregunta texto
    (value IS NOT NULL AND value >= 0 AND value <= 5)  -- likert (1-5) o boolean (0-1)
  );

-- Índice para filtrar preguntas que contribuyen al puntaje
CREATE INDEX IF NOT EXISTS idx_questions_contributes 
  ON questions(contributes_to_score) WHERE contributes_to_score = true;

-- Comentarios
COMMENT ON COLUMN questions.type IS 'Tipo de pregunta: likert (escala 1-5), boolean (sí/no), text (texto libre)';
COMMENT ON COLUMN questions.contributes_to_score IS 'Si la pregunta se incluye en el cálculo del radar/promedio';
COMMENT ON COLUMN questions.is_required IS 'Si el encuestado debe responder para poder avanzar';
COMMENT ON COLUMN responses.text_value IS 'Respuesta de texto libre (solo para questions.type=text)';
