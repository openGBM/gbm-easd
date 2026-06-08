# Modelo de Lógica de Negocio — Portal EA

## Flujos Principales

### Flujo 1: Encuestado Responde la Encuesta

```
1. Encuestado accede a /encuesta/{sessionId}
2. Sistema valida que la sesión existe y está activa
   └─ Si inactiva → mostrar mensaje "Sesión no disponible"
3. Encuestado ingresa nombre y correo
4. Sistema valida:
   └─ Email formato válido
   └─ Email no duplicado en esta sesión
   └─ Si duplicado → mostrar mensaje "Ya existe un registro con este correo"
5. Sistema registra encuestado (completed = false)
6. Sistema carga dimensiones ordenadas por display_order
7. WIZARD: Para cada dimensión (paso 1..N):
   a. Mostrar nombre y descripción de la dimensión
   b. Mostrar escala 1-5 para seleccionar
   c. Encuestado selecciona valor
   d. Puede navegar atrás para cambiar respuestas previas
8. Al completar última dimensión → botón "Enviar"
9. Sistema inserta todas las respuestas en batch (transacción)
10. Sistema marca encuestado como completed = true
11. Redirect a /resultados/{respondentId}
```

### Flujo 2: Encuestado Ve Resultados

```
1. Accede a /resultados/{respondentId}
2. Sistema carga respuestas del encuestado con JOIN a dimensions
3. Sistema renderiza:
   a. Gráfico de radar (Recharts) con valores por dimensión
   b. Tabla resumen: dimensión | valor | descripción
4. Página es estática después de completar (siempre accesible)
```

### Flujo 3: Admin Gestiona Sesiones

```
1. Admin accede a /admin/login
2. Ingresa email y password
3. Supabase Auth valida credenciales
   └─ Si inválidas → mostrar error
4. Redirect a /admin (dashboard)
5. Dashboard muestra:
   a. Lista de sesiones (nombre, estado, fecha, # encuestados)
   b. Botón "Crear sesión"
   c. QR code por cada sesión activa
6. Admin puede:
   a. Crear sesión → ingresa nombre → se genera con is_active = true
   b. Deshabilitar sesión → toggle is_active = false
   c. Habilitar sesión → toggle is_active = true
   d. Ver detalle → navega a /admin/sesiones/{id}
```

### Flujo 4: Admin Ve Detalle de Sesión

```
1. Admin navega a /admin/sesiones/{sessionId}
2. Sistema carga:
   a. Info de la sesión (nombre, estado, fecha)
   b. Lista de encuestados (nombre, email, completado, fecha)
3. Admin puede ver respuestas de un encuestado:
   a. Click en encuestado → muestra radar chart + tabla
```

---

## Lógica de Validación

### Registro de Encuestado
```typescript
// Validaciones
- name: string, min 2 caracteres, max 100
- email: formato válido (regex)
- session_id: uuid válido, sesión existente y activa
- Unique: (session_id, email)
```

### Envío de Respuestas
```typescript
// Validaciones
- respondent_id: uuid válido, no completado aún
- responses[]: array de { dimension_id, value }
- responses.length === total_dimensions (todas contestadas)
- Cada value: integer entre 1 y 5
- Cada dimension_id: uuid válido que existe en dimensions
- No duplicados de dimension_id en el array
```

---

## Datos Semilla (Seed)

### Dimensiones EA (del PDF — 6 dimensiones)

Las dimensiones se extraerán del PDF `EA_in_a_Box_20_-_The_Complete_Toolkit-14-17.pdf`. Estructura:

```sql
INSERT INTO dimensions (name, description, display_order) VALUES
('Dimensión 1', 'Descripción...', 1),
('Dimensión 2', 'Descripción...', 2),
('Dimensión 3', 'Descripción...', 3),
('Dimensión 4', 'Descripción...', 4),
('Dimensión 5', 'Descripción...', 5),
('Dimensión 6', 'Descripción...', 6);
```

**Nota**: Los nombres y descripciones exactas se definirán al leer el PDF durante Code Generation.

### Escala de Acuerdo (Agreement Scoring Scale)

| Valor | Etiqueta |
|-------|----------|
| 5 | Totalmente de acuerdo |
| 4 | De acuerdo |
| 3 | Depende / Neutral |
| 2 | En desacuerdo |
| 1 | Totalmente en desacuerdo |

### Clave de Evaluación (Evaluation Key) — Nivel de Madurez

Puntaje total = suma de las 6 dimensiones (rango 6–30):

| Rango | Nivel |
|-------|-------|
| 6–13 | Naciente |
| 14–23 | Base |
| 24–30 | Clase Mundial |

### Admin User (Seed)

```sql
-- Se creará via Supabase Auth CLI o dashboard
-- Email: admin@gbm.net (o el que indique el usuario)
```
