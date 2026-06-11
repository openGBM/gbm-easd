# Preguntas de Verificación — Analytics v2.2

## Contexto
Feature de Analytics con dos direcciones:
1. **Tendencias por instrumento**: Vista de todas las sesiones de un instrumento en el tiempo
2. **Consolidación por usuario**: Vista de todas las respuestas de un mismo email en diferentes sesiones

---

## Q1: Ubicación de la vista de Tendencias

¿Dónde debería vivir la vista de tendencias de un instrumento?

- A) Como nueva pestaña/sección dentro del detalle de sesión existente (`/admin/sesiones/[id]`)
- B) Como nueva página dedicada por instrumento (`/admin/instrumentos/[id]/tendencias`)
- C) Como sección nueva en el dashboard principal (`/admin`)
- D) Otro (describir después del tag [Answer]:)

[Answer]: B

---

## Q2: Métrica principal para Tendencias

¿Qué dato se grafica en la tendencia entre sesiones de un instrumento?

- A) Promedio general de cada sesión (un punto por sesión en el eje X = fecha)
- B) Promedio por dimensión de cada sesión (una línea por dimensión, eje X = sesiones)
- C) Ambos: un gráfico de promedio general + otro desglosado por dimensión
- D) Otro (describir)

[Answer]: C

---

## Q3: Tipo de gráfico para Tendencias

¿Qué tipo de gráfico prefieres para la vista de tendencias?

- A) Gráfico de líneas (eje X = sesiones ordenadas por fecha)
- B) Gráfico de barras agrupadas (una barra por sesión)
- C) Gráfico de líneas + tabla de datos debajo
- D) Otro (describir)

[Answer]:B

---

## Q4: Consolidación por usuario — Identificación

¿Cómo se identifica "el mismo usuario" en diferentes sesiones?

- A) Por email exacto (mismo email en respondents de distintas sesiones)
- B) Por combinación nombre + email
- C) Otro (describir)

[Answer]:A

---

## Q5: Consolidación por encuestado — Vista

¿Dónde se accede a la vista consolidada por encuestado?

- A) Desde el detalle de sesión, al hacer clic en un encuestado se ofrece "ver historial"
- B) Nueva página dedicada `/admin/encuestados` con buscador por email/nombre
- C) Ambas: accesible desde detalle de sesión y desde una página dedicada
- D) Otro (describir)

[Answer]:B

---

## Q6: Consolidación por usuario — Visualización

¿Qué se muestra en la vista de historial de un usuario?

- A) Lista de sesiones donde participó + radar comparativo (overlay de múltiples sesiones)
- B) Tabla cronológica: sesión | fecha | puntaje global | nivel de madurez
- C) Ambos: tabla cronológica + radar comparativo con todas sus participaciones superpuestas
- D) Otro (describir)

[Answer]: Tabla cronológica y radares independientes (no superpeustos) por sesion 

---

## Q7: Filtros

¿Se necesitan filtros en la vista de tendencias?

- A) No, mostrar todas las sesiones del instrumento
- B) Sí, filtro por rango de fechas
- C) Sí, filtro por fecha + filtro por sesiones específicas (checkboxes)
- D) Otro (describir)

[Answer]: C

---

## Q8: Acceso

¿Quién puede ver estas vistas de analytics?

- A) Solo admin (detrás de autenticación, como el panel actual)
- B) Admin + el propio usuario puede ver su historial personal (sin login)
- C) Otro (describir)

[Answer]: A

