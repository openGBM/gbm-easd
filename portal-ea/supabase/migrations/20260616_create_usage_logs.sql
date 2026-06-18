-- Tabla de logs de consumo por usuario
-- Registra acciones medibles: crear sesiones, generar análisis IA (con tokens)
CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  action text NOT NULL,           -- 'create_session', 'analysis'
  model text,                     -- 'gemini-2.0-flash', 'llama-3.3-70b-versatile', null para acciones sin IA
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',    -- datos adicionales (session_id, session_name, etc.)
  created_at timestamptz DEFAULT now()
);

-- Índices para consultas de consumo
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_email ON usage_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_model ON usage_logs(model) WHERE model IS NOT NULL;

-- RLS: deshabilitado para usage_logs (tabla de logs internos)
-- La seguridad se maneja a nivel de API route (autenticación requerida)
-- No se expone al anon key directamente
ALTER TABLE usage_logs DISABLE ROW LEVEL SECURITY;
