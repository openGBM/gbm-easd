# Open Questions — Consolidación

## Contradicciones Detectadas

### 1. Visibilidad de instrumentos vs. Multi-tenant schema compartido
- **Visión**: Instrumentos públicos visibles para todas las áreas, privados solo para el dueño/admin.
- **Constraint**: Schema compartido con tenant_id + RLS.
- **Tensión**: Los instrumentos "públicos" cruzan tenant boundaries. Si cada área es un tenant con tenant_id, un instrumento "público" necesita ser visible sin filtrar por tenant_id.
- **Resolución propuesta**: Agregar campo `visibility: 'public' | 'private'` a instruments. RLS permite SELECT si `visibility = 'public'` OR `tenant_id = current_tenant`. Solo el owner_id y admins globales pueden UPDATE/DELETE.

### 2. Viewer accede por enlace compartido vs. autenticación
- **Visión**: El viewer "ve la vista consolidada de una sesión específica (se le comparte el enlace)".
- **Constraint**: Supabase Auth con roles en tabla custom.
- **Tensión**: Si el viewer solo accede por enlace, ¿necesita cuenta? ¿O es un enlace público con token temporal?
- **Pregunta abierta**: ¿El viewer necesita crear cuenta y loguearse, o basta con un enlace firmado (sin login)?

### 3. Free tier vs. múltiples tenants
- **Visión**: SaaS multi-tenant con planes y límites.
- **Constraint**: Todo en free tier de servicios.
- **Tensión**: Supabase free tier tiene límites de rows (500MB), connections (50), y auth users (50K). Con múltiples tenants el crecimiento puede superar el free tier.
- **Resolución propuesta**: Iniciar con free tier. Monitorear via usage_logs. Migrar a Supabase Pro (~$25/mes) cuando se superen los límites. No es contradicción bloqueante — es planning.

## Preguntas Abiertas Pendientes

| # | Pregunta | Origen | Impacto |
|---|----------|--------|---------|
| OQ-1 | ¿El viewer necesita cuenta o accede por enlace firmado sin login? | Q9 Business vs Q1 Tech | Define si se crea tabla de usuarios para viewers o se usa enlace temporal |
| OQ-2 | ¿Qué pasa si un área se elimina? ¿Se eliminan sus sesiones/instrumentos? | Q6 Business | Define cascade behavior |
| OQ-3 | ¿Los templates son creados solo por admin global o cualquier editor puede publicar un instrumento como template? | Q7 Business | Define permisos de catálogo |
| OQ-4 | ¿El admin de un área puede crear usuarios dentro de su área, o solo el super-admin global? | Q3 Business + Q4 Multi-tenant | Define jerarquía de administración |
