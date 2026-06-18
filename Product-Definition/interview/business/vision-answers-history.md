# Business Vision — Answers History

## Batch 1 (2026-06-18)

### Q1. Visión y objetivos
- Escenario: Varios consultores de GBM usando el portal, agrupados por áreas (Human Capital, Educación, Arquitectura, etc.)
- No clientes finales accediendo directamente (por ahora)

### Q2. Roles y permisos
| Rol | Crear instrumentos | Crear sesiones | Ver resultados | Generar análisis IA | Gestionar usuarios | Ver consumo |
|-----|---|---|---|---|---|---|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editor | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Viewer | ❌ | ❌ | Solo consolidado | ❌ | ❌ | ❌ |

### Q3. Ciclo de vida del usuario
- Creación: solo por admin
- Desactivación: sí, sin eliminar
- Contraseña: el usuario gestiona la suya
- Roles: un solo rol por usuario
- Límite: sí, límite de usuarios por instancia/plan

### Q4. Multi-tenant (visión futura)
- Modelo: Tenant = equipo/área GBM
- Cada equipo tiene su espacio con sus instrumentos y sesiones

### Q5. Modelo de negocio
- SaaS con planes y límites de consumo

## Batch 2 (2026-06-18)

### Q6. Áreas y visibilidad
- Admin ve todo, Editores/Viewers solo ven su área
- Sesiones son privadas del área

### Q7. Instrumentos: públicos y privados
- Concepto de "template" general como base para crear instrumentos
- Catálogo de instrumentos públicos (visibles para todas las áreas)
- Instrumentos privados: solo el dueño y admin los ven
- Default: público
- Solo el dueño y el admin pueden gestionar un instrumento

### Q8. Planes y límites
- Número de sesiones activas
- Número de análisis IA por mes

### Q9. Viewer — alcance
- Ve la vista consolidada de una sesión específica (se le comparte el enlace)
- No tiene acceso al panel admin completo
