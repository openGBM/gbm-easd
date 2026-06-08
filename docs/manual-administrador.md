# Manual del Portal de Evaluaciones de Autodiagnóstico — GBM

## Introducción

El Portal de Evaluaciones de Autodiagnóstico es una herramienta web que permite aplicar instrumentos de evaluación a equipos y organizaciones de forma ágil, digital y sin fricción. Los participantes responden encuestas desde cualquier dispositivo (celular, tablet, computadora) y los resultados se visualizan inmediatamente con gráficos de radar, tablas de madurez y análisis interpretativo generado por inteligencia artificial.

---

## Funcionalidad General

### ¿Qué hace el portal?

| Capacidad | Descripción |
|-----------|-------------|
| Evaluar equipos | Aplicar instrumentos de autodiagnóstico con dimensiones y preguntas configurables |
| Visualizar resultados | Gráficos de radar y tablas de madurez por dimensión y global |
| Análisis IA | Interpretación ejecutiva automatizada de los resultados |
| Multi-instrumento | Gestionar distintos tipos de evaluación desde un solo portal |
| Sesiones con QR | Cada sesión genera un código QR para acceso rápido desde móvil |
| Exportar datos | Descarga de resultados en formato Excel |

### Roles del sistema

| Rol | Acceso | Funciones |
|-----|--------|-----------|
| **Administrador** | Panel admin (con login) | Gestionar instrumentos, sesiones, ver resultados, generar análisis IA, exportar |
| **Encuestado** | Enlace público (sin login) | Responder la encuesta asignada a su sesión |
| **Patrocinador** | Lectura de resultados | Recibir el análisis IA y datos exportados del admin |

### Flujo general

```
1. Admin crea un instrumento (o usa uno existente)
2. Admin crea una sesión asociada al instrumento
3. Admin comparte el enlace/QR de la sesión con los participantes
4. Los participantes responden la encuesta desde su dispositivo
5. Admin consulta resultados individuales o consolidados
6. Admin genera análisis IA interpretativo
7. Admin exporta los datos a Excel si es necesario
```

---

## Acceso al Panel de Administración

1. Navegar a la URL del portal + `/admin/login`
2. Ingresar correo electrónico y contraseña autorizados
3. Al autenticarse, se accede al dashboard principal

> **Nota**: Solo los correos incluidos en la configuración de administradores tienen acceso al panel.

---

## Gestión de Instrumentos

Un **instrumento** es un tipo de evaluación con su propio banco de dimensiones, preguntas y escala de valoración.

### Acceder al catálogo de instrumentos

1. En la barra de navegación superior, hacer clic en **"Instrumentos"**
2. Se muestra el listado de instrumentos con su estado (Activo/Inactivo) y versión actual

### Crear un nuevo instrumento

1. En la página de Instrumentos, completar el formulario:
   - **Nombre**: nombre descriptivo del instrumento (ej: "Autodiagnóstico AI-DLC")
   - **Descripción** (opcional): propósito del instrumento
   - **Expertise IA** (opcional): descripción del rol que tomará la IA al analizar resultados (ej: "Eres un consultor experto en adopción de metodologías ágiles con IA")
2. Hacer clic en **"+ Crear Instrumento"**
3. Se crea automáticamente con una versión 1 vacía

### Configurar el banco de preguntas (Import Excel)

El método más práctico para configurar un instrumento es mediante un archivo Excel:

1. Ir a **Instrumentos → [Instrumento] → Gestionar**
2. Hacer clic en **"📥 Exportar Excel"** para obtener la plantilla (si el instrumento ya tiene datos) o preparar un Excel con el formato esperado

#### Formato del Excel

El archivo debe tener **dos hojas**:

**Hoja 1: "Banco de Preguntas"** (o cualquier nombre que contenga "banco")

| Dimensión | Descripción Dimensión | Color | Orden Dimensión | Pregunta | Orden Pregunta |
|-----------|----------------------|-------|-----------------|----------|----------------|
| Contexto | Evalúa el contexto... | #1B2A4A | 1 | Pregunta 1... | 1 |
| Contexto | Evalúa el contexto... | #1B2A4A | 1 | Pregunta 2... | 2 |
| Casos de Uso | Evalúa los casos... | #E85D04 | 2 | Pregunta 1... | 1 |

- **Dimensión**: nombre de la dimensión (se repite en cada fila de pregunta)
- **Descripción Dimensión**: texto descriptivo mostrado al encuestado
- **Color**: código hexadecimal para la UI (formato #RRGGBB)
- **Orden Dimensión**: número que define la secuencia de presentación
- **Pregunta**: texto de la afirmación a evaluar
- **Orden Pregunta**: número de orden dentro de la dimensión

**Hoja 2: "Escala"** (o cualquier nombre que contenga "escala") — opcional

| Valor | Etiqueta | Descripción |
|-------|----------|-------------|
| 1 | Nada / No iniciado | No se cumple o se desconoce el tema |
| 2 | Incipiente | Se ha planteado de manera informal |
| 3 | En desarrollo | Existe avance parcial documentado |
| 4 | Establecido | Se cumple de forma consistente |
| 5 | Maduro / Optimizado | Institucionalizado y en mejora continua |

> Si no se incluye la hoja de Escala, se usan las etiquetas por defecto (Totalmente en desacuerdo → Totalmente de acuerdo).

#### Importar el Excel

1. En la página de gestión del instrumento, hacer clic en **"📤 Importar Excel"**
2. Seleccionar el archivo `.xlsx`
3. El sistema valida:
   - Que todas las dimensiones tengan nombre
   - Que cada dimensión tenga al menos una pregunta
   - Que no haya preguntas vacías
   - Que los colores sean formato hex válido
   - Que no haya órdenes duplicados
4. Si la validación pasa: muestra mensaje de éxito con conteo de dimensiones y preguntas
5. Si hay errores: muestra la lista de problemas a corregir

### Versionamiento

- Si el instrumento **no tiene respuestas** aún: el import edita la versión actual directamente
- Si el instrumento **ya tiene respuestas**: el import crea una nueva versión automáticamente
- Las sesiones existentes quedan ligadas a la versión con la que fueron creadas
- El historial de versiones es visible en la sección inferior de la página del instrumento

### Configurar el expertise de la IA

1. En la página de gestión del instrumento, buscar la sección **"🤖 Expertise IA"**
2. Hacer clic en **"Editar"** (o "Agregar" si no está definido)
3. Escribir el rol/contexto que la IA debe asumir al analizar resultados
4. Hacer clic en **"Guardar"**

**Ejemplos de expertise:**
- *"Eres un consultor experto en Arquitectura Empresarial (EA). Evalúas la madurez y eficacia de los equipos de EA en organizaciones."*
- *"Eres un experto en adopción de AI-DLC y transformación digital con herramientas de IA para equipos de desarrollo de software."*

### Activar/Desactivar instrumentos

- Solo instrumentos **activos** aparecen en el selector al crear sesiones
- Para desactivar: clic en **"Desactivar"** en el catálogo de instrumentos
- Los instrumentos desactivados no se eliminan ni pierden datos

---

## Gestión de Sesiones

Una **sesión** es una instancia de evaluación donde uno o más participantes responden un instrumento específico.

### Ver el dashboard de sesiones

Al acceder al panel admin, el dashboard muestra:

| Tarjeta | Significado |
|---------|-------------|
| Sesiones Habilitadas | Total de sesiones activas |
| Respuestas Recolectadas | Total de encuestados que completaron |
| Tiempo Promedio | Tiempo promedio en minutos para completar una encuesta |
| Instrumentos | Total de instrumentos activos (visible con multi-instrumento) |

### Crear una nueva sesión

1. En el dashboard, completar el formulario "Crear Nueva Sesión":
   - Seleccionar el **instrumento** a aplicar (dropdown)
   - Ingresar el **nombre** de la sesión (ej: "Evaluación Banco XYZ - Junio 2026")
2. Hacer clic en **"+ Crear Sesión"**
3. La sesión se crea activa y lista para recibir respuestas

### Compartir la sesión con participantes

Cada sesión genera automáticamente:
- Un **enlace único** (`/encuesta/{id-sesión}`)
- Un **código QR** visible en la tarjeta de la sesión

Para compartir:
- Copiar el enlace y enviarlo por correo/chat
- Proyectar o imprimir el QR para que los participantes escaneen con su celular

### Habilitar/Deshabilitar sesiones

- **Deshabilitar**: la sesión deja de aceptar nuevas respuestas (los participantes ven "Sesión no disponible")
- **Habilitar**: reactiva la sesión para recibir respuestas
- Las respuestas ya enviadas no se pierden al deshabilitar

### Ver detalle de una sesión

Hacer clic en **"Ver Detalle"** para acceder a:

- **Dashboard de sesión**: respuestas recolectadas y tiempo promedio específicos
- **Badge de instrumento**: muestra qué instrumento y versión se está aplicando
- **Lista de encuestados**: nombre, correo, estado (completado/pendiente), fecha
- **Resultados individuales**: clic en un encuestado para ver su radar y tabla
- **Vista consolidada**: promedio de todos los encuestados completados

### Generar análisis IA

1. En el detalle de la sesión, ir a la sección **"🤖 Análisis IA"**
2. Hacer clic en **"✨ Generar Análisis"** (requiere al menos un encuestado completado)
3. La IA genera un análisis ejecutivo que incluye:
   - Resumen general
   - Fortalezas identificadas
   - Áreas de oportunidad
   - Recomendaciones prioritarias
   - Hoja de ruta sugerida (corto, mediano y largo plazo)
4. El análisis se guarda automáticamente (no se regenera cada vez que se visita)
5. Para actualizar: clic en **"🔄 Regenerar Análisis"**
6. Para compartir: clic en **"📋 Copiar"** y pegar en correo/documento

### Exportar resultados a Excel

1. En el detalle de la sesión, hacer clic en **"📥 Exportar Excel"**
2. Se descarga un archivo `.xlsx` con dos hojas:
   - **Resumen**: una fila por encuestado, promedio por dimensión + promedio general
   - **Detalle**: todas las respuestas individuales (nombre, correo, dimensión, pregunta, valor)

### Eliminar sesiones

1. Hacer clic en **"Eliminar"** en la tarjeta de la sesión (o **"Eliminar Sesión"** en el detalle)
2. Confirmar en el diálogo (muestra el nombre de la sesión)
3. Se eliminan todos los encuestados y respuestas asociados

> ⚠️ Esta acción no se puede deshacer.

---

## Experiencia del Encuestado

El participante accede al enlace de la sesión (sin necesidad de login):

1. **Registro**: ingresa nombre y correo electrónico
2. **Evaluación**: responde las preguntas dimensión por dimensión (wizard con barra de progreso)
3. **Resultados**: al finalizar, ve inmediatamente su gráfico de radar y tabla de madurez

**Características:**
- Escala de valores 1-5 con etiquetas visibles en cada paso
- Puede navegar hacia atrás para cambiar respuestas
- Si cierra el navegador antes de enviar, puede reanudar con el mismo correo
- Una vez enviada, no puede responder de nuevo (se muestra mensaje informativo)

---

## Niveles de Madurez

Los resultados se clasifican en tres niveles calculados automáticamente según la cantidad de preguntas de cada dimensión:

| Nivel | Rango | Significado |
|-------|-------|-------------|
| 🔴 Naciente | Tercio inferior | Capacidad no desarrollada o incipiente |
| 🟡 Base | Tercio medio | Capacidad en desarrollo con avances parciales |
| 🟢 Clase Mundial | Tercio superior | Capacidad madura e institucionalizada |

El cálculo se adapta automáticamente: si una dimensión tiene 5 preguntas (máx 25 puntos), los rangos se dividen en tercios de ese máximo. Si tiene 6 preguntas (máx 30), se ajusta proporcionalmente.

---

## Preguntas Frecuentes

**¿Cuántos instrumentos puedo tener?**
No hay límite. Cada instrumento tiene su banco de preguntas independiente.

**¿Puedo modificar un instrumento que ya tiene respuestas?**
Sí. El sistema crea automáticamente una nueva versión. Las sesiones existentes conservan la versión original con la que fueron creadas.

**¿Los encuestados necesitan crear cuenta?**
No. Solo ingresan nombre y correo para identificarse.

**¿Puedo aplicar el mismo instrumento a distintos clientes?**
Sí. Cada sesión es independiente. Crea una sesión por cliente/evento usando el mismo instrumento.

**¿El análisis IA tiene costo?**
El análisis usa servicios gratuitos con límites de uso. Para uso corporativo intensivo se pueden configurar API keys con planes pagados.

**¿Puedo personalizar la escala de valores?**
Sí. Cada instrumento puede tener sus propias etiquetas para los valores 1-5, configurables desde el Excel de importación.
