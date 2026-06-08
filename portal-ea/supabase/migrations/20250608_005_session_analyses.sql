-- Migración: Crear tabla session_analyses para almacenar análisis IA
-- Fecha: 2025-06-08
-- Descripción: Almacena el análisis generado por IA (Gemini) para cada sesión.
--   Un análisis por sesión (upsert). Se regenera bajo demanda del admin.

CREATE TABLE IF NOT EXISTS session_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  analysis_text text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by text,
  total_respondents integer DEFAULT 0,
  UNIQUE (session_id)
);

-- Índice para búsqueda por sesión
CREATE INDEX IF NOT EXISTS idx_session_analyses_session_id ON session_analyses(session_id);

-- RLS
ALTER TABLE session_analyses ENABLE ROW LEVEL SECURITY;

-- Solo admins autenticados pueden leer y escribir análisis
CREATE POLICY "session_analyses_select_admin" ON session_analyses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "session_analyses_insert_admin" ON session_analyses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "session_analyses_update_admin" ON session_analyses
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "session_analyses_delete_admin" ON session_analyses
  FOR DELETE USING (auth.role() = 'authenticated');
