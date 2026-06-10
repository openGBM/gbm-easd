# Análisis Crítico del Portal de Evaluaciones de Autodiagnóstico

**Fecha**: Junio 2026  
**Versión evaluada**: v1.1.0 + feature/multi-instrument-vision (pre-release v2.0)  
**Autor**: Revisión técnica de arquitectura

---

## 1. Estado Actual del Sistema

### Resumen Ejecutivo

El portal es una aplicación funcional en producción (Vercel + Supabase Cloud) que cumple con su propósito principal: aplicar instrumentos de autodiagnóstico con visualización de resultados y análisis IA. La versión multi-instrumento está en desarrollo activo con feature flag.

### Stack Tecnológico

| Capa | Tecnología | Versión | Estado |
|------|------------|---------|--------|
| Framework | Next.js (App Router) | 16.2.7 | Actual |
| Runtime | React | 19.2.4 | Actual |
| Estilos | Tailwind CSS | 4.x | Actual |
| BD | Supabase (PostgreSQL) | Cloud | Operativo |
| Auth | Supabase Auth | — | Funcional |
| IA | Groq (Llama 3.3 70B) + Gemini 2.0 Flash | Free tier | Operativo |
| Feature Flags | Vercel Flags SDK | Instalado | Configurado via env var |
| Exportación | ExcelJS | 4.4.0 | Operativo |
| Visualización | Recharts | 3.8.1 | Operativo |
| Despliegue | Vercel | — | Producción |

### Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Páginas/Rutas | 9 (5 públicas + 4 admin) |
| API Routes | 1 (/api/analysis) |
| Componentes | 9 |
| Migraciones SQL | 7 |
| Tablas en BD | 8 (sessions, dimensions, questions, respondents, responses, session_analyses, instruments, instrument_versions) |
| Dependencias producción | ~18 |
| Tests unitarios | 26 (Vitest) |
| Tests E2E | 26 (Playwright — flujo encuesta, admin, concurrencia 10 usuarios) |
| Vulnerabilidades conocidas | 4 moderadas (postcss en Next.js, uuid en exceljs) |

---

## 2. Análisis de Diseño

### Fortalezas

| Aspecto | Evaluación |
|---------|------------|
| Simplicidad arquitectónica | Buena — 2 capas (componente → Supabase) sin over-engineering |
| Feature flag approach | Correcto — permite activar multi-instrumento sin romper v1.x |
| Retrocompatibilidad | Sólida — columnas nullable, fallbacks, sesiones v1.x siguen funcionando |
| Versionamiento de instrumentos | Bien diseñado — solo versiona cuando hay respuestas, edita in-place si no |
| Import/Export Excel | Práctico — facilita la configuración sin UI de edición compleja |
| Análisis IA con fallback | Resiliente — Gemini → Groq como alternativa |

### Debilidades

| Aspecto | Problema | Impacto | Recomendación |
|---------|----------|---------|---------------|
| No hay capa de servicios | Toda la lógica está en los componentes de página | Dificulta testing y reutilización | Extraer servicios para operaciones complejas (versionamiento, import) |
| Client-side heavy | Las páginas admin hacen muchas queries desde el browser | Performance en conexiones lentas | Considerar Server Components o API routes para queries pesadas |
| Sin tests | No hay tests unitarios ni e2e | Riesgo en regresiones | Implementar tests para flujos críticos (encuesta, import, análisis IA) |
| Sin validación server-side del import | El Excel se parsea y se inserta desde el client | Datos inconsistentes si el client falla mid-import | Mover lógica de import a un API Route con transacción |
| Tipos `any` en queries Supabase | Varios casteos `as any` en JOINs | Falta de type safety | Generar tipos con `supabase gen types` y usar tipado estricto |
| Feature flag via env var | `NEXT_PUBLIC_MULTI_INSTRUMENT` es público | No permite toggling sin redeploy | Migrar a Vercel Flags Dashboard (ya instalado, solo falta conectar) |

### Deuda Técnica Identificada

1. **Import Excel sin transacción**: si falla a mitad de la inserción, queda en estado parcial
2. **`AGREEMENT_SCALE` hardcodeada**: sigue existiendo como constante aunque ya no es la única escala
3. **`flags.ts` no se usa en runtime**: el flag se lee de env var directamente en los componentes, no del SDK
4. **Middleware eliminado**: no hay protección server-side de rutas admin (solo client-side redirect)
5. **Console.error en producción**: errores se logean pero no se reportan a un servicio de monitoreo

---

## 3. Análisis de Seguridad

### Controles Implementados ✅

| Control | Estado |
|---------|--------|
| Autenticación Supabase Auth | Activo |
| Verificación de email autorizado (AdminLayout) | Activo |
| RLS en todas las tablas | Activo |
| GRANTS diferenciados (anon vs authenticated) | Activo |
| Validación UUID en rutas públicas | Activo |
| Sanitización de ai_expertise_prompt (prompt injection) | Activo |
| HTTPS en producción (Vercel) | Activo |
| No exposición de secrets en client | Activo |

### Vulnerabilidades y Riesgos

| Riesgo | Severidad | Descripción | Mitigación Sugerida |
|--------|-----------|-------------|---------------------|
| Sin rate limiting en login | Media | Supabase tiene rate limiting interno pero no hay feedback visual ni bloqueo progresivo | Agregar contador de intentos fallidos + lockout temporal |
| Sin middleware server-side | Media | Las rutas admin se protegen solo client-side (redirect en `checkAuth`). Un request directo al API/page podría exponer datos brevemente | Reimplementar middleware Next.js o usar server-side auth checks en cada page |
| Cookies de sesión sin configuración explícita | Baja | Se usa la configuración default de Supabase SSR | Verificar flags `httpOnly`, `secure`, `sameSite` |
| Import Excel sin sanitización de contenido | Baja | El texto de preguntas/dimensiones se inserta tal cual | Sanitizar HTML/scripts en textos importados |
| API key de Groq en server-side | Baja | La key está en env var server-side (no expuesta al client) | OK — pero considerar rotación periódica |
| Sin auditoría de acciones admin | Media | No hay log de quién creó/eliminó sesiones/instrumentos | Agregar tabla de audit log |
| CORS no configurado explícitamente | Baja | Next.js maneja CORS por defecto | Revisar si se necesitan restricciones adicionales |

### Cumplimiento

| Aspecto | Estado |
|---------|--------|
| Datos personales (nombre, email) | Se almacenan — no hay política de retención definida |
| Derecho a eliminar datos | Admin puede eliminar encuestados manualmente |
| Cifrado en reposo | Supabase Cloud cifra por defecto |
| Cifrado en tránsito | HTTPS en Vercel + Supabase |
| Backups | Dependiente del plan de Supabase Cloud |

---

## 4. Puntos de Mejora Prioritarios

### Prioridad Alta (impacto en confiabilidad)

| # | Mejora | Esfuerzo | Beneficio |
|---|--------|----------|-----------|
| 1 | Mover import Excel a API Route con transacción | 2-3h | Evita estados parciales, atomicidad |
| 2 | Reimplementar middleware Next.js para proteger /admin/* | 1h | Seguridad server-side real |
| 3 | Conectar feature flag al Vercel Flags Dashboard | 1-2h | Toggle sin redeploy, rollback instantáneo |
| 4 | Agregar tests e2e para flujo de encuesta | 4-6h | Previene regresiones en el flujo crítico |

### Prioridad Media (impacto en mantenibilidad)

| # | Mejora | Esfuerzo | Beneficio |
|---|--------|----------|-----------|
| 5 | Generar tipos Supabase (`supabase gen types`) | 1h | Type safety, autocompletado, menos `any` |
| 6 | Extraer servicios (InstrumentService, SessionService) | 3-4h | Separación de responsabilidades, testabilidad |
| 7 | Agregar loading states y error boundaries | 2-3h | UX más robusta ante fallos |
| 8 | Monitoreo de errores (Sentry o similar) | 1-2h | Visibilidad de problemas en producción |

### Prioridad Baja (nice-to-have)

| # | Mejora | Esfuerzo | Beneficio |
|---|--------|----------|-----------|
| 9 | Dark mode (cuando se requiera) | 2h | Accesibilidad visual |
| 10 | Internacionalización (i18n) | 4-6h | Soporte multi-idioma |
| 11 | PWA con soporte offline para encuestas | 6-8h | Funciona sin internet estable |
| 12 | Notificaciones por email al completar | 2-3h | Admin informado en tiempo real |

---

## 5. Roadmap Recomendado

### v2.0 — Multi-Instrumento (En desarrollo)

**Objetivo**: Habilitar la gestión de múltiples instrumentos con versionamiento  
**Estado**: ~85% completado  
**Pendiente**:
- [ ] Conectar feature flag al Vercel Flags Dashboard (no solo env var)
- [ ] Pruebas end-to-end con flag ON y OFF
- [ ] Migración de datos en Supabase Cloud
- [ ] Documentación AI-DLC actualizada con todos los cambios

**Criterio de release**: Funciona correctamente con flag ON en Vercel, sin romper comportamiento con flag OFF.

---

### v2.1 — Editor Visual y UX

**Objetivo**: Reducir fricción operativa del admin  
**Estado**: ✅ Completado

| Tarea | Tipo | Estado |
|-------|------|--------|
| Editor visual de preguntas (editar texto, reordenar, agregar/eliminar) | UX | ✅ |
| Editor visual de escala de valores (1-5) | UX | ✅ |
| Editor visual de niveles de madurez (umbrales + labels configurables) | UX | ✅ |
| Duplicar instrumento existente | Productividad | ✅ |
| Filtros y búsqueda en listado de sesiones | UX | ✅ |
| Tests unitarios (26 tests Vitest) | Calidad | ✅ |
| Tests E2E flujo encuesta + admin (15 tests Playwright) | Calidad | ✅ |
| Test de concurrencia 10 usuarios simultáneos | Calidad | ✅ |
| Error boundaries en páginas admin | UX | Pendiente |
| Monitoreo de errores (Sentry o similar) | Observabilidad | Pendiente |

---

### v2.2 — Comunicación y Analytics

**Objetivo**: Mejorar visibilidad y comunicación  
**Estimado**: 2-3 semanas

| Tarea | Tipo |
|-------|------|
| Notificaciones por email al completar encuesta | Comunicación |
| Dashboard con gráficos históricos (tendencias) | Analytics |
| Comparación entre versiones de un instrumento | Visibilidad |
| Exportación PDF de resultados con branding | Output |

---

### v3.0 — Escalas y Personalización Avanzada

**Objetivo**: Flexibilidad total en la configuración de instrumentos  
**Estimado**: 3-4 semanas

| Tarea | Tipo |
|-------|------|
| Escalas configurables (no solo 1-5) | Core |
| Tipos de pregunta variados (opción múltiple, texto libre) | Core |
| Lógica condicional entre preguntas | Core |
| Templates de instrumento (pre-configurados) | Productividad |
| Exportación PDF de resultados con branding | Output |
| API pública para integración con otros sistemas | Integración |

---

### v4.0 — Multi-tenant y Enterprise

**Objetivo**: Escalar a múltiples organizaciones  
**Estimado**: 6-8 semanas

| Tarea | Tipo |
|-------|------|
| Multi-tenant (organizaciones aisladas) | Arquitectura |
| Roles granulares (admin, viewer, editor) | Seguridad |
| SSO (SAML, OAuth corporativo) | Enterprise |
| Branding personalizado por organización | Personalización |
| SLA y soporte dedicado | Operaciones |
| Migración a infraestructura propia (AWS) | Infraestructura |

---

## 6. Conclusión

El portal está en un estado funcional sólido para su uso como MVP y herramienta interna de GBM. La arquitectura es simple y apropiada para el alcance actual. Los principales riesgos están en la falta de tests automatizados y la ausencia de middleware server-side. El roadmap propuesto prioriza estabilización antes de agregar funcionalidades nuevas, lo cual es la decisión correcta para un producto que ya tiene usuarios reales.

La evolución a multi-instrumento está bien diseñada con feature flags y retrocompatibilidad, lo que permite una migración gradual sin riesgo para la operación actual.
