# Vision Document — Administración de Usuarios, Roles y Multi-tenant

## Resumen Ejecutivo

Evolucionar el Portal de Evaluaciones GBM de un sistema single-admin a una plataforma SaaS multi-tenant con gestión de usuarios, roles, áreas y límites de consumo. Esto permite que múltiples equipos de consultores GBM (Human Capital, Educación, Arquitectura, etc.) operen de forma aislada en una misma instancia.

---

## Modelo de Entidades

```
Super Admin (global)
  └── Tenants (áreas: Human Capital, Educación, Arquitectura...)
        ├── Admin de Área (gestiona usuarios de su tenant)
        ├── Editores (crean sesiones, ven resultados, generan análisis)
        └── Viewers (acceden por enlace firmado, sin cuenta)

Instrumentos
  ├── Públicos (catálogo global, visibles para todos los tenants)
  ├── Privados (solo visibles para el tenant owner + super admin)
  └── Templates (creados solo por super admin, base para crear instrumentos)
```

---

## Roles y Jerarquía

| Rol | Scope | Capacidades |
|-----|-------|-------------|
| **Super Admin** | Global | Todo: crear tenants, gestionar todos los usuarios, crear templates, ver todo |
| **Admin de Área** | Su tenant | Crear editores/viewers en su área, crear instrumentos, crear sesiones, ver resultados, generar análisis |
| **Editor** | Su tenant | Crear sesiones, ver resultados de su área, generar análisis IA |
| **Viewer** | Por enlace | Ver resultados consolidados de una sesión específica (sin cuenta, enlace firmado) |

### Reglas
- Un usuario tiene **un solo rol**
- Un usuario pertenece a **un solo tenant**
- El super admin NO pertenece a un tenant (transversal)
- El viewer NO tiene cuenta — accede por enlace temporal generado por el admin/editor

---

## Visibilidad y Aislamiento

| Recurso | Super Admin | Admin Área | Editor | Viewer |
|---------|-------------|-----------|--------|--------|
| Sesiones de su área | ✅ | ✅ | ✅ | Solo la compartida |
| Sesiones de otra área | ✅ | ❌ | ❌ | ❌ |
| Instrumentos públicos | ✅ | ✅ (usar) | ✅ (usar) | ❌ |
| Instrumentos privados de su área | ✅ | ✅ (gestionar) | ❌ | ❌ |
| Instrumentos de otra área | ✅ | ❌ | ❌ | ❌ |
| Templates | ✅ (crear/gestionar) | ✅ (usar como base) | ✅ (usar como base) | ❌ |
| Consumo global | ✅ | ❌ | ❌ | ❌ |
| Consumo de su área | ✅ | ✅ | ❌ | ❌ |

---

## Instrumentos: Público, Privado, Template

| Tipo | Quién crea | Quién ve | Quién gestiona |
|------|-----------|----------|----------------|
| **Template** | Solo super admin | Todos (como base) | Solo super admin |
| **Público** | Admin de área | Todos los tenants (catálogo) | Owner + super admin |
| **Privado** | Admin de área | Solo su tenant + super admin | Owner + super admin |

- Default al crear: **público**
- Un template sirve como base para crear un instrumento propio (se duplica)
- Un instrumento público puede ser usado (crear sesiones) por cualquier área pero solo gestionado por el owner

---

## Ciclo de Vida del Usuario

```
Super Admin crea Tenant → Super Admin o Admin Área crea Usuario → 
Usuario recibe email con credenciales → Usuario cambia contraseña → 
Usuario opera según su rol → Admin puede desactivar (soft delete)
```

- **Creación**: Super admin crea tenants y admins de área. Admin de área crea editores/viewers en su tenant. Solo el super admin puede crear admins de área.
- **Desactivación**: Soft delete (is_active=false). No puede loguearse pero sus datos se conservan.
- **Eliminación**: No se elimina — solo desactivar. Datos nunca se borran.
- **Contraseña**: El usuario gestiona la suya (Supabase Auth password reset).

---

## Tenant (Área)

- Representa un equipo/área de GBM (Human Capital, Educación, Arquitectura)
- Creado solo por el super admin
- Tiene: nombre, descripción, is_active
- **Soft delete**: si se desactiva, las sesiones e instrumentos quedan pero nadie de ese tenant puede acceder
- Cada sesión y cada instrumento privado tiene un `tenant_id`

---

## Plan y Límites de Consumo

| Dimensión limitada | Controlado por |
|--------------------|----------------|
| Sesiones activas (por tenant) | Query a sessions WHERE tenant_id AND is_active |
| Análisis IA por mes (por tenant) | Query a usage_logs WHERE tenant_id AND action='analysis' AND mes actual |

- Los límites se definen por tenant (configurables por super admin)
- Se validan antes de crear sesión / generar análisis
- Si se excede: error amigable "Límite alcanzado, contacta al administrador"
- Sin billing externo (Stripe) por ahora — el super admin ajusta límites manualmente

---

## Constraints Técnicos

| Aspecto | Decisión |
|---------|----------|
| Auth | Supabase Auth (email/password). SSO se migra después. |
| Multi-tenant DB | Schema compartido con tenant_id. RLS filtra por tenant. |
| Hosting | Una sola instancia Vercel. Dominio único. |
| Presupuesto | Free tier de todos los servicios. Advertir antes de usar pagos. |
| Viewer auth | Sin cuenta — enlace firmado (token temporal) |

---

## Fases de Implementación

### Fase 1 (v2.1) — Usuarios y Roles
- Tabla `users` con role, tenant_id, is_active
- Tabla `tenants` con nombre, límites, is_active
- CRUD de usuarios desde panel super admin
- CRUD de tenants desde panel super admin
- Admin de área crea editores en su tenant
- Login existente lee rol de la tabla users
- RLS actualizado con tenant_id en sessions, instruments
- Proxy.ts valida rol además de autenticación
- UI: sección "Usuarios" y "Tenants" en admin

### Fase 2 (v2.2) — Visibilidad y Templates
- Campo visibility en instruments (public/private)
- Catálogo de instrumentos públicos
- Templates (solo super admin)
- Duplicar template como instrumento propio
- Enlace firmado para viewer (token temporal con expiración)

### Fase 3 (v3.0) — Límites y Multi-tenant completo
- Configuración de límites por tenant
- Validación de límites antes de crear sesión/análisis
- Dashboard de consumo por tenant
- SSO (futuro)

---

## Open Questions Resueltas

| # | Decisión |
|---|----------|
| OQ-1 | Viewer NO necesita cuenta — accede por enlace firmado sin login |
| OQ-2 | Áreas se desactivan (soft delete), datos se conservan (nunca se eliminan) |
| OQ-3 | Solo super admin crea templates |
| OQ-4 | Admin de área puede crear editores/viewers en su área. Solo el super admin puede crear admins de área. |
