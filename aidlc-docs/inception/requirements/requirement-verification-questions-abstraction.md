# Preguntas de Verificación — Abstracción Arquitectónica v3.1

**Propósito**: Clarificar el alcance y enfoque del refactoring para introducir capas de abstracción que desacoplen la dependencia de Supabase y faciliten una posible migración a AWS.

---

## Contexto

El sistema actual (v3.0) tiene:
- **15+ archivos** con llamadas directas a `supabase.from('tabla')` desde componentes, páginas y API routes
- **3 clientes Supabase** (browser, server, admin) sin abstracción de repositorio/servicio
- **Dependencias externas directas**: Supabase Auth, Upstash Redis (rate limiting), Gemini/Groq AI
- **Sin capa de servicios**: La lógica de datos está co-localizada con la UI

---

## Q1: Alcance de la Abstracción

¿Qué dependencias quieres abstraer en esta iteración?

A) Solo base de datos (Supabase → Repository Pattern) — Mínimo viable  
B) Base de datos + Autenticación (Auth provider agnóstico)  
C) Base de datos + Autenticación + Rate Limiting (Redis/Upstash agnóstico)  
D) Todas las dependencias externas (DB + Auth + Rate Limit + AI Provider + Storage)  
X) Otro (describir después del tag [Answer]:)

[Answer]: B

---

## Q2: Prioridad de Migración Target

Si bien el objetivo es ser "provider-agnostic", ¿cuál es el target de migración más probable?

A) AWS (DynamoDB/RDS + Cognito + API Gateway) — Cloud-native AWS  
B) AWS (Supabase self-hosted en EC2/ECS) — Mínimo cambio de código  
C) Azure (CosmosDB/SQL + Azure AD + Functions)  
D) Mantener Supabase pero con abstracción para flexibilidad futura  
E) Híbrido: Supabase para desarrollo/staging, AWS para producción  
X) Otro (describir después del tag [Answer]:)

[Answer]: A

---

## Q3: Estrategia de Implementación por Fases

¿Cómo prefieres estructurar las fases de implementación?

A) **Strangler Fig Pattern**: Envolver Supabase actual en interfaces, migrar tabla por tabla  
B) **Branch by Abstraction**: Crear capa de abstracción completa, switch progresivo  
C) **Big Bang controlado**: Refactorear toda la capa de datos en un solo sprint  
D) **Feature Flag por provider**: Ambos providers coexisten, se selecciona vía config  
X) Otro (describir después del tag [Answer]:)

[Answer]: B

---

## Q4: Nivel de Observabilidad Requerido

¿Qué nivel de observabilidad necesitas integrar en la capa de abstracción?

A) **Básico**: Logging estructurado (tiempos de query, errores) — console/file  
B) **Intermedio**: Logging + Métricas de rendimiento (latencia por operación, tasas de error)  
C) **Avanzado**: Logging + Métricas + Tracing distribuido (OpenTelemetry compatible)  
D) **Completo**: Todo lo anterior + alertas + dashboards + health checks  
X) Otro (describir después del tag [Answer]:)

[Answer]: B

---

## Q5: Restricciones de Costo

¿Cuál es la restricción presupuestaria para la observabilidad y la infraestructura de abstracción?

A) **Cero costo adicional**: Solo herramientas gratuitas/open-source, sin SaaS externo  
B) **Mínimo** ($0-50 USD/mes): Puede incluir tiers gratuitos de servicios (Grafana Cloud free, AWS Free Tier)  
C) **Moderado** ($50-200 USD/mes): Puede incluir servicios pagados con límites  
D) **El costo correcto**: Invertir lo necesario para calidad enterprise  
X) Otro (describir después del tag [Answer]:)

[Answer]: A

---

## Q6: Comparación de Infraestructura

¿Qué alternativas quieres comparar formalmente?

A) Supabase (actual) vs AWS nativo (RDS/DynamoDB + Cognito + CloudWatch)  
B) Supabase vs AWS vs Azure  
C) Supabase vs AWS vs self-hosted (Docker/Kubernetes)  
D) Solo Supabase vs AWS (las dos opciones más relevantes)  
X) Otro (describir después del tag [Answer]:)

[Answer]: A

---

## Q7: Impacto en Funcionalidad Existente

¿Hay alguna funcionalidad que NO debe modificarse durante este refactoring?

A) El flujo de encuesta pública (registro → respuesta → resultados) debe permanecer intacto  
B) Todo puede modificarse internamente siempre que la UX no cambie  
C) La API pública (routes) debe mantener compatibilidad de contrato  
D) A + C (proteger tanto la UX pública como los contratos de API)  
X) Otro (describir después del tag [Answer]:)

[Answer]: B

---

## Q8: Testing durante la Migración

¿Qué estrategia de testing prefieres para validar que la abstracción no rompe nada?

A) Tests de integración end-to-end (Playwright existentes) como safety net  
B) Tests unitarios por cada adapter/repository + E2E existentes  
C) Tests de contrato (contract tests) entre la capa abstracta y cada provider  
D) B + C (unitarios + contratos + E2E)  
X) Otro (describir después del tag [Answer]:)

[Answer]: D

---

## Q9: Documentación de Decisiones

¿Qué formato prefieres para documentar las decisiones de arquitectura?

A) **ADR (Architecture Decision Records)** — Un archivo por decisión, formato estándar  
B) **RFC interno** — Documentos más extensos con pros/cons/alternativas  
C) **Sección en el diseño de aplicación** — Integrado en la documentación AI-DLC existente  
D) **A + C** — ADRs individuales + resumen integrado en diseño  
X) Otro (describir después del tag [Answer]:)

[Answer]: D

---

## Q10: Extensión de Seguridad

¿Deben aplicarse reglas de seguridad como restricciones bloqueantes para este refactoring?

A) Sí — aplicar todas las reglas de SEGURIDAD como constraints bloqueantes (recomendado para la capa de datos/auth)  
B) No — omitir reglas de seguridad (solo para PoC/prototipos)  
X) Otro (describir después del tag [Answer]:)

[Answer]: A

---

## Q11: Extensión de Resiliencia

¿Debe aplicarse el baseline de resiliencia a este refactoring?

A) Sí — aplicar prácticas de resiliencia (tolerancia a fallos, alta disponibilidad, observabilidad, recuperabilidad) como guía de diseño  
B) No — omitir el baseline de resiliencia  
X) Otro (describir después del tag [Answer]:)

[Answer]: A

---

## Q12: Extensión de Property-Based Testing

¿Deben aplicarse reglas de PBT (Property-Based Testing)?

A) Sí — aplicar PBT para la capa de abstracción (adapter correctness, serialización, transformaciones)  
B) Parcial — solo para funciones puras y round-trips de serialización (como en v3.0)  
C) No — omitir PBT  
X) Otro (describir después del tag [Answer]:)

[Answer]: A

---

## Instrucciones

Por favor responde cada pregunta colocando tu respuesta después del tag `[Answer]:` correspondiente (ej: `[Answer]: A` o `[Answer]: D, con la nota de que...`).

Si tienes alguna preferencia adicional o contexto que quieras agregar, puedes hacerlo libremente en cualquier respuesta.
