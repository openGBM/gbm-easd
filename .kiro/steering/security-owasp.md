# Revisión de Seguridad OWASP

Antes de mergear cualquier PR o hacer release, verificar las siguientes categorías del OWASP Top 10 que aplican al portal:

## Checklist obligatorio

1. **Injection (A03)** — Validar que toda entrada de usuario esté sanitizada:
   - Inputs de búsqueda no se interpolan directamente en queries (usar escape/parametrización)
   - Zod validation en todos los API routes
   - AI prompts sanitizados (prompt injection mitigation)

2. **Broken Authentication (A07)** — Verificar:
   - proxy.ts protege rutas `/admin/*`
   - Rate limiting server-side en login y registro
   - ADMIN_EMAILS default deny-all (sin fallback permisivo)
   - Sesiones de Supabase se refrescan en el proxy

3. **Sensitive Data Exposure (A02)** — Verificar:
   - API keys no expuestas al cliente (solo NEXT_PUBLIC_* son públicas)
   - Resultados de encuestados protegidos por UUID (no enumerables)
   - RLS activo en todas las tablas

4. **Security Misconfiguration (A05)** — Verificar:
   - CSP headers configurados (sin unsafe-eval en producción)
   - HSTS, X-Frame-Options, Referrer-Policy activos
   - npm audit sin vulnerabilidades high/critical

5. **XSS (A07)** — Verificar:
   - React escapa output por defecto
   - ReactMarkdown no permite HTML raw
   - Input de texto libre (text_value) se renderiza escapado

## Vulnerabilidades conocidas (aceptadas)

Las siguientes son vulnerabilidades en dependencias transitivas sin fix disponible:
- `postcss` (moderate) — en node_modules de Next.js. Se resuelve cuando Next.js actualice.
- `uuid` (moderate) — en node_modules de ExcelJS. Solo afecta si se usa `buf` parameter en v3/v5, que no usamos.

## Cuándo ejecutar

- Antes de cada merge de PR a main
- Antes de cada release tag
- Cuando se agregue un nuevo API route
- Cuando se modifique la lógica de autenticación/autorización
- Comando: `npm audit --audit-level=high`

## Restricciones absolutas

- **NUNCA desactivar RLS** (`DISABLE ROW LEVEL SECURITY`) como solución a problemas de permisos. Siempre resolver con policies correctas o ajustando el role del cliente.
- Si una tabla necesita inserts server-side que bypasean RLS, usar el service_role key con `NO FORCE ROW LEVEL SECURITY` en la tabla (service_role bypasea RLS por defecto si no hay FORCE).
