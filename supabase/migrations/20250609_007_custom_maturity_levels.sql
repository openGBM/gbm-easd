-- Migración: Niveles de madurez configurables por instrumento
-- Fecha: 2025-06-09
-- Descripción: Agrega campo maturity_levels (jsonb) a instrument_versions.
--   Permite definir umbrales y labels personalizados para los niveles de madurez.
--   Si es NULL, se usan los tercios automáticos como fallback.
--
-- Formato esperado del JSON:
-- [
--   { "label": "Inicial", "color": "#EF4444", "minAverage": 1.0, "maxAverage": 2.3 },
--   { "label": "En progreso", "color": "#F59E0B", "minAverage": 2.4, "maxAverage": 3.6 },
--   { "label": "Avanzado", "color": "#10B981", "minAverage": 3.7, "maxAverage": 5.0 }
-- ]

ALTER TABLE instrument_versions
ADD COLUMN IF NOT EXISTS maturity_levels jsonb DEFAULT NULL;
