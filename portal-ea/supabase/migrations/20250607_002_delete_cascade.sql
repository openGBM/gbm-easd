-- Migración: Asegurar eliminación en cascada para sesiones
-- Fecha: 2025-06-07
-- Descripción: Garantiza que al eliminar una sesión se eliminan
--   todos los encuestados y sus respuestas automáticamente (ON DELETE CASCADE).
--   Esta migración es idempotente: las FK con CASCADE ya se definieron
--   en la migración inicial, pero se incluye como referencia explícita
--   para la funcionalidad de "eliminar sesión" del panel admin.

-- Nota: Las foreign keys con ON DELETE CASCADE ya están definidas en la migración inicial:
--   - respondents.session_id → sessions(id) ON DELETE CASCADE
--   - responses.respondent_id → respondents(id) ON DELETE CASCADE
--
-- Esto significa que:
--   DELETE FROM sessions WHERE id = 'xxx'
--   Automáticamente elimina respondents y responses asociados.
--
-- Sin embargo, el código de la aplicación realiza la eliminación manual
-- en orden (responses → respondents → session) como medida de seguridad
-- adicional en caso de que las políticas RLS bloqueen la cascada.

-- Verificación: asegurar que las policies de DELETE están correctas
-- (ya definidas en 20250607_001_initial_schema.sql)

-- No se requieren cambios adicionales al esquema.
-- Esta migración documenta la decisión de diseño.
