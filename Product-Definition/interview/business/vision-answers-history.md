# Business Vision - Answers History (append-only)

## Section 1: Executive Summary — Validated 2026-06-07

### Q1 [CORE]: Project name and type
b) Customer-facing product. Nombre: "Portal de Autodiagnóstico de Arquitectura Empresarial"

### Q2 [CORE]: Target users one-liner
CTO, CEO, Managers de Banca, Seguros e Industria que desean conocer su nivel de madurez

### Q3 [CORE]: Core capability
Autodiagnóstico para evaluar rápidamente la madurez y eficacia de la arquitectura empresarial

### Q4 [CORE]: Business problem
Identificación/Autodiagnóstico guiado — un proceso consultivo que toma tiempo realizar en persona

### Q5 [CORE]: Measurable outcome
Reducción del 80% en el tiempo de evaluación de madurez EA

---
Section 1 Complete — 2026-06-07

## Section 2: Business Context — Validated 2026-06-07

### Q6: Problem statement
Actualmente la evaluación de madurez de EA se realiza mediante sesiones de consultoría presencial que toman días en agendar y completar. Los clientes GBM no tienen una forma rápida y autónoma de conocer su nivel de madurez sin depender de un consultor disponible.

### Q7: Business drivers / why now
c) Internal efficiency / cost reduction

### Q8 [CORE]: Target users and stakeholders
| Role | Description | Primary Need |
|------|-------------|--------------|
| Encuestado | La persona que responde la encuesta | Ingresar las respuestas y ver los resultados |
| Admin | La persona que gestiona el portal | Gestión completa de encuestados, sesiones, accesos, habilitar/deshabilitar respuestas por sesión |

### Q9: Business constraints
b) Delivery deadline — martes 09 de junio de 2026

### Q10 [CORE]: Success metrics
| Metric | Current State | Target State | Measurement Method |
|--------|---------------|--------------|--------------------|
| Tiempo de respuesta | 2 días | 15 min | Tiempo desde inicio de la encuesta hasta ver los resultados |

---
Section 2 Complete — 2026-06-07

## Section 3: Full Scope Vision — Validated 2026-06-07

### Q11: Product vision statement
Todo cliente GBM puede conocer su nivel de madurez EA de forma autónoma en minutos, sin necesidad de agendar una consultoría, recibiendo resultados inmediatos y comparables en el tiempo.

### Q12: Feature areas
Dimensiones de evaluación definidas en `docs/EA_in_a_Box_20_-_The_Complete_Toolkit-14-17.pdf`. Flujo principal: un consultor entrega el enlace a la encuesta para que el cliente lo responda durante una sesión previamente habilitada.

### Q13: Future extensions not committed
b) None — la visión es todo lo considerado.

---
Section 3 Complete — 2026-06-07

## Section 4: MVP Scope — IN — Validated 2026-06-07

### Q14 [CORE]: MVP features
| Feature | Rationale | Primary User Type |
|---------|-----------|-------------------|
| Registro de encuestado (nombre, correo) | Identificar quién responde | Encuestado |
| Encuesta de madurez EA (dimensiones del PDF) | Core value prop — evaluar el nivel | Encuestado |
| Gráfico de radar con resultados | Visualización inmediata del diagnóstico | Encuestado |
| Tabla resumen de respuestas por sesión | Ver detalle de valores por dimensión | Encuestado |
| Gestión de sesiones (crear/habilitar/deshabilitar) | Control de cuándo se puede responder | Admin |
| Panel de administración (ver encuestados y sesiones) | Visibilidad y control operativo | Admin |

### Q15: Non-functional priorities
d) Security and data protection

---
Section 4 Complete — 2026-06-07

## Section 5: MVP Scope — OUT — Validated 2026-06-07

### Q16: Features deliberately excluded
| Excluded Feature | Reason | Target Phase |
|------------------|--------|--------------|
| AWS deployment | Time restrictions | Phase 2 |

---
Section 5 Complete — 2026-06-07

## Section 6: Risks and Open Questions — Validated 2026-06-07

### Q17: Known risks
| Risk | Impact (High/Med/Low) | Mitigation |
|------|-----------------------|------------|
| Deadline extremo (2 días para MVP completo) | High | Priorizar features mínimas, usar Supabase para acelerar backend |

### Q18: Open questions / uncertainties
b) None — everything above is decided.

---
Section 6 Complete — 2026-06-07
