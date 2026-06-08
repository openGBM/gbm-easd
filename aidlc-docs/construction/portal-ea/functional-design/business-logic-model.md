# Modelo de Lógica de Negocio — Portal EA

## Flujos Principales

### Flujo 1: Encuestado Responde la Encuesta

```
1. Encuestado accede a /encuesta/{sessionId}
2. Sistema valida que la sesión existe y está activa
   └─ Si inactiva → mostrar mensaje "Sesión no disponible"
3. Sistema carga dimensiones con preguntas (JOIN dimensions + questions)
4. Encuestado ingresa nombre y correo
5. Sistema valida:
   └─ Email formato válido
   └─ Nombre entre 2 y 100 caracteres
   └─ Email no duplicado en esta sesión:
       └─ Si duplicado Y completed=true → "Ya respondiste esta encuesta"
       └─ Si duplicado Y completed=false → reanudar (cargar respuestas previas)
6. Sistema registra encuestado (completed = false)
7. WIZARD: Para cada dimensión (paso 1..N):
   a. Mostrar nombre, descripción y color de la dimensión
   b. Mostrar leyenda de escala (1-5)
   c. Mostrar 6 preguntas con botones 1-5 para cada una
   d. Debe responder todas las preguntas para avanzar
   e. Puede navegar atrás para cambiar respuestas previas
8. Al completar última dimensión → botón "Enviar Evaluación"
9. Sistema hace upsert de todas las respuestas (onConflict: respondent_id, question_id)
10. Sistema marca encuestado como completed = true
11. Redirect a /resultados/{respondentId}
```

### Flujo 2: Encuestado Ve Resultados

```
1. Accede a /resultados/{respondentId}
2. Sistema valida formato UUID del parámetro
3. Sistema carga encuestado (solo si completed = true)
   └─ Si no encontrado → "Resultados no encontrados"
4. Sistema carga respuestas con JOINs: responses → questions → dimensions
5. Sistema calcula promedio por dimensión (total/count)
6. Sistema calcula suma por dimensión (para nivel de madurez)
7. Sistema renderiza:
   a. Gráfico de radar (Recharts) con promedio por dimensión (escala 1-5)
   b. Tabla resumen: dimensión | suma/30 | nivel (Naciente/Base/Clase Mundial)
   c. Nivel de madurez global (suma total / máximo)
8. Página siempre accesible con el enlace directo
```

### Flujo 3: Admin Gestiona Sesiones

```
1. Admin accede a /admin/login
2. Ingresa email y password
3. Supabase Auth valida credenciales
   └─ Si inválidas → mostrar error "Credenciales inválidas"
4. Redirect a /admin (dashboard)
5. AdminLayout verifica email contra lista de admins autorizados
   └─ Si no autorizado → "Acceso Denegado"
6. Dashboard muestra:
   a. Lista de sesiones (nombre, estado, fecha, # encuestados)
   b. Formulario "Crear sesión" (nombre obligatorio)
   c. QR code por cada sesión con URL completa
7. Admin puede:
   a. Crear sesión → ingresa nombre → se genera con is_active = true
   b. Deshabilitar sesión → toggle is_active = false
   c. Habilitar sesión → toggle is_active = true
   d. Eliminar sesión → confirmación obligatoria → elimina responses, respondents y sesión (cascade)
   e. Ver detalle → navega a /admin/sesiones/{id}
```

### Flujo 4: Admin Ve Detalle de Sesión

```
1. Admin navega a /admin/sesiones/{sessionId}
2. Sistema carga:
   a. Info de la sesión (nombre, estado, fecha)
   b. Lista de encuestados (nombre, email, completado, fecha)
3. Admin puede:
   a. Ver resultados individuales:
      - Click en encuestado → calcula promedio por dimensión → muestra radar chart + tabla
   b. Ver vista consolidada:
      - Promedio de TODOS los encuestados completados de la sesión
      - Radar chart + tabla con datos agregados
   c. Eliminar encuestado:
      - Confirmación antes de eliminar
      - Elimina responses primero, luego respondent
   d. Eliminar sesión completa:
      - Confirmación obligatoria con nombre de sesión visible
      - Elimina responses de todos los encuestados → respondents → sesión (cascade)
      - Redirige a /admin después de eliminar
```

---

## Lógica de Validación

### Registro de Encuestado
```typescript
// Validaciones
- name: string, min 2 caracteres, max 100
- email: formato válido (regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
- session_id: uuid válido, sesión existente y activa
- Unique: (session_id, email)
- Si email duplicado + completed=true: mostrar "Ya respondiste"
- Si email duplicado + completed=false: reanudar (cargar respuestas previas)
```

### Envío de Respuestas
```typescript
// Validaciones
- respondent_id: uuid válido
- responses[]: array de { question_id, value }
- Cada value: integer entre 1 y 5
- Debe haber respuesta para todas las preguntas de todas las dimensiones
- Upsert: onConflict (respondent_id, question_id)
- Post-upsert: marcar respondent.completed = true
```

---

## Datos Semilla (Seed)

### Dimensiones EA (del PDF — 8 dimensiones)

Las 8 dimensiones se extrajeron del PDF `EA_in_a_Box_20_-_The_Complete_Toolkit-14-17.pdf`. Cada dimensión tiene un color asignado y 6 preguntas.

```sql
INSERT INTO dimensions (name, description, display_order, color) VALUES
('Dimensión 1', 'Descripción...', 1, '#2563EB'),
('Dimensión 2', 'Descripción...', 2, '#7C3AED'),
...
('Dimensión 8', 'Descripción...', 8, '#0D9488');

INSERT INTO questions (dimension_id, text, display_order) VALUES
-- 6 preguntas por dimensión (48 preguntas total)
...
```

### Escala de Acuerdo (Agreement Scoring Scale)

| Valor | Etiqueta |
|-------|----------|
| 5 | Totalmente de acuerdo |
| 4 | De acuerdo |
| 3 | Depende / Neutral |
| 2 | En desacuerdo |
| 1 | Totalmente en desacuerdo |

### Clave de Evaluación (Evaluation Key) — Nivel de Madurez

**Por dimensión** (6 preguntas × max 5 = 30 puntos máximo):

| Rango | Nivel |
|-------|-------|
| 6–13 | Naciente |
| 14–23 | Base |
| 24–30 | Clase Mundial |

**Global** (8 dimensiones × 30 = 240 puntos máximo):

| Rango | Nivel |
|-------|-------|
| 48–112 | Naciente |
| 113–176 | Base |
| 177–240 | Clase Mundial |

### Admin User (Seed)

```sql
-- Creado via Supabase Auth
-- Email: admin@gbm.net
-- Verificado en AdminLayout contra lista de emails autorizados
```
