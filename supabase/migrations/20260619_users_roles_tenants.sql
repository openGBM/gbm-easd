-- v2.1: Usuarios, Roles y Tenants
-- Agrega gestión de usuarios con roles y multi-tenant por áreas

-- Tabla de tenants (áreas)
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  max_active_sessions integer NOT NULL DEFAULT 10,
  max_analyses_per_month integer NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

-- Tabla de perfiles de usuario (extiende Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'editor',
  tenant_id uuid REFERENCES tenants(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chk_profile_role CHECK (role IN ('super_admin', 'admin', 'editor'))
);

-- Agregar tenant_id a sessions (nullable para retrocompatibilidad)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- Agregar tenant_id a instruments (nullable para retrocompatibilidad)
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- Agregar visibility a instruments
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
ALTER TABLE instruments ADD CONSTRAINT chk_instrument_visibility
  CHECK (visibility IN ('public', 'private', 'template'));

-- Agregar owner_id a instruments
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES profiles(id);

-- Agregar tenant_id a usage_logs
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_instruments_tenant ON instruments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_instruments_visibility ON instruments(visibility);

-- RLS para tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenants_select" ON tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "tenants_insert" ON tenants FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "tenants_update" ON tenants FOR UPDATE TO service_role USING (true);

-- RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO service_role USING (true);

-- GRANTs
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON tenants TO service_role;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
