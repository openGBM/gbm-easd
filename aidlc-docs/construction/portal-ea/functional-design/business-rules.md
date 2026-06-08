# Reglas de Negocio — Portal EA

## Reglas de Sesión

| ID | Regla | Validación |
|----|-------|------------|
| BR-01 | Solo sesiones activas aceptan nuevos encuestados | Verificar `sessions.is_active = true` antes de registrar |
| BR-02 | Solo sesiones activas aceptan respuestas | Verificar `sessions.is_active = true` antes de guardar |
| BR-03 | El admin puede crear, activar y desactivar sesiones | Requiere usuario autenticado con rol admin |
| BR-04 | Cada sesión genera un URL único | Formato: `/encuesta/{session_id}` |

## Reglas de Encuestado

| ID | Regla | Validación |
|----|-------|------------|
| BR-05 | Email único por sesión | UNIQUE constraint en (session_id, email) |
| BR-06 | Nombre y correo son obligatorios | NOT NULL + validación frontend |
| BR-07 | Email debe tener formato válido | Regex de email en frontend |
| BR-08 | Encuestado se marca completado al enviar todas las respuestas | UPDATE `completed = true` después de insertar N responses (N = total dimensions) |

## Reglas de Respuesta

| ID | Regla | Validación |
|----|-------|------------|
| BR-09 | Valor entre 1 y 5 | CHECK constraint en DB + validación frontend |
| BR-10 | Una respuesta por pregunta por encuestado | UNIQUE constraint en (respondent_id, question_id) |
| BR-11 | Debe responder TODAS las preguntas de TODAS las dimensiones para completar | Verificar count(responses) = count(questions) |
| BR-12 | Las respuestas se envían via upsert (permite reanudación) | Upsert con onConflict: respondent_id, question_id |
| BR-13 | Encuestado puede reanudar si no completó | Cargar respuestas previas y continuar desde donde quedó |

## Reglas de Visualización

| ID | Regla | Validación |
|----|-------|------------|
| BR-14 | El gráfico de radar muestra todas las dimensiones | Eje por cada dimensión, valor 1-5 |
| BR-15 | La tabla resumen muestra dimensión + valor | Ordenada por display_order |
| BR-16 | Resultados visibles inmediatamente al completar | Redirect a /resultados/{respondent_id} |

## Reglas de Seguridad

| ID | Regla | Validación |
|----|-------|------------|
| BR-17 | Panel admin requiere autenticación | Supabase Auth + middleware Next.js |
| BR-18 | RLS protege datos sensibles | Policies en PostgreSQL |
| BR-19 | Encuestados no pueden ver respuestas de otros | RLS: solo su respondent_id |
| BR-20 | Cualquiera con el enlace puede responder (sin login) | No auth para rutas /encuesta/* |

## Reglas del Wizard (Stepper)

| ID | Regla | Validación |
|----|-------|------------|
| BR-21 | Una dimensión por paso (con todas sus preguntas) | Mostrar solo la dimensión actual con sus 6 preguntas |
| BR-22 | Navegación adelante/atrás permitida | Botones Anterior/Siguiente |
| BR-23 | Debe responder todas las preguntas de la dimensión antes de avanzar | Validar que todas las preguntas tengan respuesta |
| BR-24 | Barra de progreso visible con color de la dimensión | Mostrar paso actual / total + porcentaje |
| BR-25 | Último paso muestra botón "Enviar Evaluación" en lugar de "Siguiente" | Condición: currentStep === totalSteps |
| BR-26 | Leyenda de escala visible en cada paso | Mostrar significado de cada valor (1-5) |

## Reglas de Administración Avanzada

| ID | Regla | Validación |
|----|-------|------------|
| BR-27 | Vista consolidada muestra promedio de encuestados completados | Filtrar solo respondents con completed = true |
| BR-28 | Admin puede eliminar un encuestado y todas sus respuestas | Eliminar responses primero, luego respondent (cascade) |
| BR-29 | Lista de admins autorizados por email | Verificar email contra lista en AdminLayout |
| BR-30 | Si email duplicado y ya completó, mostrar mensaje informativo | "Ya respondiste esta encuesta" |
