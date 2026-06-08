-- Migración: Multi-Instrumento (v2.x)
-- Fecha: 2025-06-08
-- Descripción: Agrega soporte para múltiples instrumentos de evaluación
--   con versionamiento del banco de preguntas.

-- ============================================================
-- NUEVAS TABLAS
-- ============================================================

-- Instrumentos de evaluación
CREATE TABLE IF NOT EXISTS instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  ai_expertise_prompt text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Versiones del banco de preguntas por instrumento
CREATE TABLE IF NOT EXISTS instrument_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  version_tag text NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  notes text,
  scale_labels jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instrument_id, version_number),
  UNIQUE (instrument_id, version_tag)
);

-- ============================================================
-- COLUMNAS NUEVAS EN TABLAS EXISTENTES
-- ============================================================

-- Sesiones: asociar a versión de instrumento (nullable para retrocompatibilidad v1.x)
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS instrument_version_id uuid REFERENCES instrument_versions(id);

-- Dimensiones: asociar a versión de instrumento (nullable para seed v1.x)
ALTER TABLE dimensions
ADD COLUMN IF NOT EXISTS instrument_version_id uuid REFERENCES instrument_versions(id);

-- Eliminar constraint UNIQUE global en display_order (ahora puede repetirse entre versiones)
ALTER TABLE dimensions DROP CONSTRAINT IF EXISTS dimensions_display_order_key;

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_instrument_versions_instrument_id ON instrument_versions(instrument_id);
CREATE INDEX IF NOT EXISTS idx_instrument_versions_is_current ON instrument_versions(instrument_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_sessions_instrument_version_id ON sessions(instrument_version_id);
CREATE INDEX IF NOT EXISTS idx_dimensions_instrument_version_id ON dimensions(instrument_version_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_versions ENABLE ROW LEVEL SECURITY;

-- Instrumentos: lectura pública (selector), escritura admin
CREATE POLICY "instruments_select_public" ON instruments
  FOR SELECT USING (true);

CREATE POLICY "instruments_insert_admin" ON instruments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "instruments_update_admin" ON instruments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "instruments_delete_admin" ON instruments
  FOR DELETE USING (auth.role() = 'authenticated');

-- Versiones: lectura pública (carga de encuesta), escritura admin
CREATE POLICY "instrument_versions_select_public" ON instrument_versions
  FOR SELECT USING (true);

CREATE POLICY "instrument_versions_insert_admin" ON instrument_versions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "instrument_versions_update_admin" ON instrument_versions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "instrument_versions_delete_admin" ON instrument_versions
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- GRANTS
-- ============================================================

GRANT ALL ON instruments TO authenticated;
GRANT SELECT ON instruments TO anon;

GRANT ALL ON instrument_versions TO authenticated;
GRANT SELECT ON instrument_versions TO anon;

-- ============================================================
-- SEED: Instrumento por defecto + Versión 1
-- ============================================================

-- Instrumento seed: Autodiagnóstico de Arquitectura Empresarial
INSERT INTO instruments (id, name, description, ai_expertise_prompt, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Autodiagnóstico de Arquitectura Empresarial',
  'Evaluación de madurez EA basada en EA in a Box 2.0. Evalúa 8 dimensiones con 48 preguntas en escala de acuerdo (1-5).',
  'Eres un consultor experto en Arquitectura Empresarial (EA). Evalúas la madurez y eficacia de los equipos de EA en organizaciones.',
  true
) ON CONFLICT (id) DO NOTHING;

-- Versión 1 del instrumento seed
INSERT INTO instrument_versions (id, instrument_id, version_number, version_tag, is_current)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  1,
  '1',
  true
) ON CONFLICT (id) DO NOTHING;

-- Asociar dimensiones existentes (seed v1.x) a la versión 1 del instrumento
UPDATE dimensions
SET instrument_version_id = 'b0000000-0000-0000-0000-000000000001'
WHERE instrument_version_id IS NULL;

-- ============================================================
-- POLICIES ADICIONALES PARA dimensions Y questions (INSERT/UPDATE/DELETE admin)
-- ============================================================

CREATE POLICY IF NOT EXISTS "dimensions_insert_admin" ON dimensions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "dimensions_update_admin" ON dimensions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "dimensions_delete_admin" ON dimensions
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "questions_insert_admin" ON questions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "questions_update_admin" ON questions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "questions_delete_admin" ON questions
  FOR DELETE USING (auth.role() = 'authenticated');
