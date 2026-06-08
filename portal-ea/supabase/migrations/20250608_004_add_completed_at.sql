-- Migración: Agregar campo completed_at a respondents
-- Fecha: 2025-06-08
-- Descripción: Registra el timestamp de cuándo el encuestado completó la evaluación.
--   Permite calcular el tiempo promedio de respuesta (completed_at - created_at).

ALTER TABLE respondents
ADD COLUMN IF NOT EXISTS completed_at timestamptz DEFAULT NULL;

-- Opcional: actualizar registros existentes que ya completaron
-- (no tendrán tiempo exacto, pero evita NULLs en datos históricos)
UPDATE respondents
SET completed_at = created_at + INTERVAL '10 minutes'
WHERE completed = true AND completed_at IS NULL;
