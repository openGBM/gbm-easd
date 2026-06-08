-- Migración inicial: Esquema del Portal de Autodiagnóstico EA
-- Fecha: 2025-06-07

-- ============================================================
-- TABLAS
-- ============================================================

-- Sesiones de evaluación
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Dimensiones de evaluación EA (8 dimensiones)
CREATE TABLE IF NOT EXISTS dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  display_order integer NOT NULL UNIQUE,
  color text
);

-- Preguntas por dimensión (6 preguntas por dimensión)
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id uuid NOT NULL REFERENCES dimensions(id) ON DELETE CASCADE,
  text text NOT NULL,
  display_order integer NOT NULL
);

-- Encuestados (respondents)
CREATE TABLE IF NOT EXISTS respondents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, email)
);

-- Respuestas
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id uuid NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  value integer NOT NULL CHECK (value >= 1 AND value <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (respondent_id, question_id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_respondents_session_id ON respondents(session_id);
CREATE INDEX IF NOT EXISTS idx_respondents_email_session ON respondents(email, session_id);
CREATE INDEX IF NOT EXISTS idx_responses_respondent_id ON responses(respondent_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON responses(question_id);
CREATE INDEX IF NOT EXISTS idx_questions_dimension_id ON questions(dimension_id);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Sesiones: lectura pública, escritura solo admin autenticado
CREATE POLICY "sessions_select_public" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "sessions_insert_admin" ON sessions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "sessions_update_admin" ON sessions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "sessions_delete_admin" ON sessions
  FOR DELETE USING (auth.role() = 'authenticated');

-- Dimensiones y preguntas: solo lectura pública
CREATE POLICY "dimensions_select_public" ON dimensions
  FOR SELECT USING (true);

CREATE POLICY "questions_select_public" ON questions
  FOR SELECT USING (true);

-- Encuestados: inserción pública (registro), lectura/delete admin
CREATE POLICY "respondents_select_public" ON respondents
  FOR SELECT USING (true);

CREATE POLICY "respondents_insert_public" ON respondents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "respondents_update_public" ON respondents
  FOR UPDATE USING (true);

CREATE POLICY "respondents_delete_admin" ON respondents
  FOR DELETE USING (auth.role() = 'authenticated');

-- Respuestas: inserción/lectura pública, delete admin
CREATE POLICY "responses_select_public" ON responses
  FOR SELECT USING (true);

CREATE POLICY "responses_insert_public" ON responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "responses_update_public" ON responses
  FOR UPDATE USING (true);

CREATE POLICY "responses_delete_admin" ON responses
  FOR DELETE USING (auth.role() = 'authenticated');
