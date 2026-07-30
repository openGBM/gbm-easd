-- Fix: Permitir value=NULL en responses para preguntas de tipo texto
-- El constraint original (value >= 1 AND value <= 5) impedía guardar text_value
-- porque el sentinel value=0 violaba el check.
-- Solución: permitir NULL en value y relajar el check constraint.

-- 1. Quitar NOT NULL de la columna value
ALTER TABLE responses ALTER COLUMN value DROP NOT NULL;

-- 2. Eliminar todos los CHECK constraints posibles sobre value
-- (el nombre puede variar según cómo PostgreSQL lo auto-generó)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'responses'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'  -- CHECK constraint
      AND pg_get_constraintdef(con.oid) LIKE '%value%'
  LOOP
    EXECUTE format('ALTER TABLE responses DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- 3. Agregar constraint flexible: value puede ser NULL (texto) o entre 0 y 5
ALTER TABLE responses ADD CONSTRAINT responses_value_check
  CHECK (value IS NULL OR (value >= 0 AND value <= 5));
