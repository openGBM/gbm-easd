-- v2.2: RLS policies para aislamiento por tenant
-- Super admin (via service_role) bypasa RLS
-- Usuarios autenticados solo ven datos de su tenant

-- Helper function: obtener tenant_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: verificar si es super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==================== SESSIONS ====================
-- Eliminar policies existentes
DROP POLICY IF EXISTS "sessions_select" ON sessions;
DROP POLICY IF EXISTS "sessions_insert" ON sessions;
DROP POLICY IF EXISTS "sessions_update" ON sessions;
DROP POLICY IF EXISTS "sessions_delete" ON sessions;

-- Super admin ve todo; otros solo su tenant (o sesiones sin tenant para retrocompatibilidad)
CREATE POLICY "sessions_select" ON sessions FOR SELECT TO authenticated
  USING (is_super_admin() OR tenant_id IS NULL OR tenant_id = get_user_tenant_id());

CREATE POLICY "sessions_insert" ON sessions FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR tenant_id IS NULL OR tenant_id = get_user_tenant_id());

CREATE POLICY "sessions_update" ON sessions FOR UPDATE TO authenticated
  USING (is_super_admin() OR tenant_id IS NULL OR tenant_id = get_user_tenant_id());

CREATE POLICY "sessions_delete" ON sessions FOR DELETE TO authenticated
  USING (is_super_admin() OR tenant_id IS NULL OR tenant_id = get_user_tenant_id());

-- ==================== INSTRUMENTS ====================
DROP POLICY IF EXISTS "instruments_select" ON instruments;
DROP POLICY IF EXISTS "instruments_insert" ON instruments;
DROP POLICY IF EXISTS "instruments_update" ON instruments;

-- Ver: super_admin todo, otros ven públicos + templates + su tenant
CREATE POLICY "instruments_select" ON instruments FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR visibility IN ('public', 'template')
    OR tenant_id IS NULL
    OR tenant_id = get_user_tenant_id()
  );

CREATE POLICY "instruments_insert" ON instruments FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR tenant_id = get_user_tenant_id());

CREATE POLICY "instruments_update" ON instruments FOR UPDATE TO authenticated
  USING (is_super_admin() OR (tenant_id = get_user_tenant_id() AND owner_id = auth.uid()));

-- ==================== RESPONDENTS ====================
-- Los respondents se filtran por la sesión a la que pertenecen
DROP POLICY IF EXISTS "respondents_select" ON respondents;
DROP POLICY IF EXISTS "respondents_insert" ON respondents;

-- Cualquiera puede insertar (registro público por enlace)
CREATE POLICY "respondents_insert" ON respondents FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Ver: super_admin todo, otros solo respondents de sesiones de su tenant
CREATE POLICY "respondents_select" ON respondents FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR session_id IN (
      SELECT id FROM sessions WHERE tenant_id IS NULL OR tenant_id = get_user_tenant_id()
    )
  );

-- ==================== RESPONSES ====================
DROP POLICY IF EXISTS "responses_select" ON responses;
DROP POLICY IF EXISTS "responses_insert" ON responses;
DROP POLICY IF EXISTS "responses_update" ON responses;

-- Cualquiera puede insertar/actualizar respuestas (encuestados públicos)
CREATE POLICY "responses_insert" ON responses FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "responses_update" ON responses FOR UPDATE TO anon, authenticated
  USING (true);

-- Ver: super_admin todo, otros solo respuestas de sesiones de su tenant
CREATE POLICY "responses_select" ON responses FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR respondent_id IN (
      SELECT r.id FROM respondents r
      JOIN sessions s ON r.session_id = s.id
      WHERE s.tenant_id IS NULL OR s.tenant_id = get_user_tenant_id()
    )
  );

-- ==================== SERVICE_ROLE BYPASS ====================
-- Asegurar que service_role bypasa todas las policies
ALTER TABLE sessions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE instruments NO FORCE ROW LEVEL SECURITY;
ALTER TABLE respondents NO FORCE ROW LEVEL SECURITY;
ALTER TABLE responses NO FORCE ROW LEVEL SECURITY;
