# Reglas de Negocio — Portal EA

## Reglas de Sesión

| ID | Regla | Validación |
|----|-------|------------|
| BR-01 | Solo sesiones activas aceptan nuevos encuestados | Verificar `sessions.is_active = true` antes de registrar |
| BR-02 | Solo sesiones activas aceptan respuestas | Verificar `sessions.is_active = true` antes de guardar |
| BR-03 | El admin puede crear, activar, desactivar y eliminar sesiones | Requiere usuario autenticado con rol admin |
| BR-04 | Cada sesión genera un URL único | Formato: `/encuesta/{session_id}` |
| BR-31 | Eliminar sesión requiere confirmación explícita del admin | Diálogo confirm() con nombre de sesión visible |
| BR-32 | Eliminar sesión elimina en cascada: responses → respondents → session | Orden de eliminación para respetar FK constraints |

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
| BR-33 | Dashboard global muestra sesiones habilitadas | Contar sessions con is_active = true |
| BR-34 | Dashboard global muestra total de respuestas recolectadas | Contar respondents con completed = true |
| BR-35 | Dashboard global muestra tiempo promedio de respuesta | Promedio de (completed_at - created_at) de respondents completados, en minutos |
| BR-36 | Al completar encuesta se registra completed_at | UPDATE respondents SET completed_at = now() junto con completed = true |
| BR-37 | Exportar a Excel solo disponible para admin autenticados | Protegido por AdminLayout + verificación auth en la página |
| BR-38 | Exportar a Excel requiere al menos un encuestado completado | Botón deshabilitado si no hay encuestados con completed = true |
| BR-39 | Excel genera 2 hojas: Resumen y Detalle | Resumen con promedios por dimensión, Detalle con respuestas individuales |
| BR-40 | Dashboard de sesión muestra total de respuestas de esa sesión | Contar respondents con completed = true y session_id = sesión actual |
| BR-41 | Dashboard de sesión muestra tiempo promedio de respuesta de esa sesión | Promedio de (completed_at - created_at) de respondents completados de esa sesión, en minutos |
| BR-42 | Análisis IA se genera bajo demanda del admin | Botón "Generar Análisis" visible solo con encuestados completados |
| BR-43 | Análisis IA se almacena en BD (un análisis por sesión) | Tabla session_analyses con upsert por session_id |
| BR-44 | Análisis IA se puede regenerar | Botón "Regenerar Análisis" sobrescribe el análisis anterior |
| BR-45 | Análisis IA solo accesible para admins autenticados | Route Handler verifica auth + email en allowedAdmins |
| BR-46 | Análisis IA requiere GEMINI_API_KEY o GROQ_API_KEY configurada | Retorna error 500 si ninguna está configurada |
| BR-47 | Análisis IA usa fallback: Gemini → Groq | Si Gemini falla (429/quota), intenta con Groq (Llama 3.3 70B) |
| BR-48 | Análisis IA se renderiza con formato markdown | Usa react-markdown para mostrar negritas, listas, encabezados |
| BR-49 | Admin puede copiar análisis al portapapeles | Botón "Copiar" usa navigator.clipboard.writeText() |
