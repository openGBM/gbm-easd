-- v2.2: Tabla de enlaces firmados para viewers (sin cuenta)
CREATE TABLE IF NOT EXISTS viewer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  is_revoked boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_viewer_links_token ON viewer_links(token);
CREATE INDEX IF NOT EXISTS idx_viewer_links_session ON viewer_links(session_id);

-- RLS con policies para service_role
ALTER TABLE viewer_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "viewer_links_service" ON viewer_links FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "viewer_links_read" ON viewer_links FOR SELECT TO authenticated USING (true);

GRANT ALL ON viewer_links TO service_role;
GRANT SELECT ON viewer_links TO authenticated;
