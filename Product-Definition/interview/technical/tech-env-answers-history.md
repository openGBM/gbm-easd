# Technical Constraints — Answers History

## Batch 1 (2026-06-18)

### Q1. Autenticación
- Seguir con Supabase Auth (roles vía metadata o tabla custom)
- SSO se migrará más adelante (no bloquea v2.1)

### Q2. Multi-tenant approach
- Schema compartido con tenant_id (una sola BD, RLS filtra por tenant)
- Supabase actual se mantiene

### Q3. Hosting y deployment
- Una sola instancia de Vercel (multi-tenant en app)
- Dominio único (no subdomains por tenant)

### Q4. Límites técnicos del plan
- Controlar desde usage_logs existente (query antes de crear sesión/análisis, rechazar si excede)
- Sin billing externo para el MVP
- Sin Stripe ni servicios de pago inicialmente

### Q5. Restricciones tecnológicas
- Mantener todo en free tier de servicios
- Advertir y solicitar confirmación si algún servicio requiere pago
- No hay tecnologías prohibidas explícitas más allá de costo
