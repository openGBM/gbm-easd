# Manual del Portal de Evaluaciones — GBM (v2.2)

## Introducción

El Portal de Evaluaciones es una herramienta web que permite aplicar instrumentos de evaluación a equipos y organizaciones de forma ágil, digital y sin fricción. Los participantes responden encuestas desde cualquier dispositivo (celular, tablet, computadora) y los resultados se visualizan inmediatamente con gráficos de radar, pie charts, tablas de madurez y análisis interpretativo generado por inteligencia artificial.

---

## Funcionalidad General

### ¿Qué hace el portal?

| Capacidad | Descripción |
|-----------|-------------|
| Evaluar equipos | Aplicar instrumentos con dimensiones y preguntas configurables (Likert, Sí/No, Texto libre) |
| Visualizar resultados | Gráficos de radar, pie charts para boolean, lista de respuestas abiertas y tablas de madurez |
| Análisis IA | Interpretación ejecutiva automatizada con tracking de tokens consumidos |
| Multi-instrumento | Gestionar distintos tipos de evaluación desde un solo portal |
| Catálogo e instrumentos | Instrumentos públicos, privados y templates con control de visibilidad |
| Multi-tenant | Aislamiento por áreas (tenants) con usuarios y roles jerárquicos |
| Usuarios y roles | Super Admin, Admin de Área y Editor con permisos diferenciados |
| Viewer links | Enlace firmado temporal para compartir resultados sin necesidad de cuenta |
| Landing page | Cada sesión muestra una página de bienvenida con info del instrumento antes de comenzar |
| Sesiones con QR | Código QR con botones de copiar URL y copiar QR como imagen |
| Exportar datos | Descarga de resultados en formato Excel y PDF |
| Tendencias | Visualización de la evolución de resultados entre sesiones de un instrumento |
| Historial de encuestados | Consolidación de participaciones de un mismo encuestado en múltiples sesiones |
| Tracking de consumo | Registro de sesiones creadas, análisis generados y tokens de IA por usuario |

### Roles del sistema

| Rol | Acceso | Funciones |
|-----|--------|-----------|
| **Super Admin** | Panel admin completo | Gestionar todo: tenants, usuarios, instrumentos (incluido marcar como template), sesiones, análisis IA, consumo global |
| **Admin de Área** | Panel admin (scoped a su tenant) | Gestionar instrumentos, sesiones, usuarios de su área, ver resultados, generar análisis IA, crear viewer links |
| **Editor** | Panel admin (scoped a su tenant) | Crear sesiones, ver resultados de su área, generar análisis IA, crear viewer links |
| **Encuestado** | Enlace público (sin login) | Responder la encuesta asignada a su sesión |
| **Viewer** | Enlace firmado temporal (sin cuenta) | Ver resultados consolidados de una sesión específica |

### Flujo general

```
1. Admin crea un instrumento (o usa uno existente)
2. Admin crea una sesión asociada al instrumento
3. Admin comparte el enlace/QR de la sesión con los participantes
4. Los participantes responden la encuesta desde su dispositivo
5. Admin consulta resultados individuales o consolidados
6. Admin genera análisis IA interpretativo
7. Admin exporta los datos a Excel o descarga PDF de resultados
8. Admin consulta tendencias del instrumento entre sesiones
9. Admin busca el historial de un encuestado en múltiples sesiones
```

---

## Acceso al Panel de Administración

1. Navegar a la URL del portal + `/admin/login`
2. Ingresar correo electrónico y contraseña autorizados
3. Al autenticarse, se accede al dashboard principal

> **Nota**: Solo los usuarios con perfil activo en el sistema (creados por un Super Admin o Admin de Área) pueden acceder al panel. El primer Super Admin se configura directamente en la base de datos durante el setup inicial.

---

## Gestión de Áreas (Tenants)

Un **tenant** (área) representa un equipo o división dentro de GBM (ej: Human Capital, Educación, Arquitectura). Cada tenant opera de forma aislada: sus sesiones, instrumentos privados y usuarios son invisibles para otros tenants.

### Acceder a la gestión de áreas

1. En la barra de navegación, hacer clic en **"Áreas"** (solo visible para Super Admin)
2. Se muestra el listado de áreas con su scorecard de uso

### Crear un área

1. Completar el formulario "Crear Nueva Área":
   - **Nombre**: nombre del área (ej: "Human Capital")
   - **Descripción** (opcional): propósito del área
2. Hacer clic en **"+ Crear Área"**
3. El área se crea con límites por defecto: 10 sesiones activas, 50 análisis/mes

### Scorecard de uso por área

Cada tarjeta de área muestra en tiempo real:

| Indicador | Descripción |
|-----------|-------------|
| Usuarios | Cantidad de usuarios activos en el área |
| Sesiones | Sesiones activas / límite máximo |
| Análisis/mes | Análisis IA generados este mes / límite mensual |

### Configurar límites

- **Sesiones activas**: editar inline el número máximo de sesiones simultáneas
- **Análisis por mes**: editar inline el límite mensual de generación de análisis IA

> Los límites se editan directamente en la tarjeta del área y se guardan al salir del campo.

### Activar/Desactivar un área

- **Desactivar**: ningún usuario del área puede acceder al panel. Las sesiones e instrumentos se conservan.
- **Activar**: restaura el acceso para todos los usuarios del área.

> ⚠️ Las áreas nunca se eliminan (soft delete). Los datos se conservan siempre.

---

## Gestión de Usuarios

Los usuarios del sistema se gestionan desde la sección **"Usuarios"** del panel admin.

### Acceder a la gestión de usuarios

1. En la barra de navegación, hacer clic en **"Usuarios"**
2. Super Admin ve todos los usuarios. Admin de Área ve solo usuarios de su tenant.

### Crear un usuario

1. Completar el formulario "Crear Nuevo Usuario":
   - **Nombre completo**
   - **Correo electrónico** (será su login)
   - **Contraseña** (mínimo 8 caracteres)
   - **Rol**: Editor o Admin de Área
   - **Área**: seleccionar el tenant al que pertenecerá
2. Hacer clic en **"+ Crear Usuario"**

**Reglas de creación:**
- Solo **Super Admin** puede crear usuarios con rol "Admin de Área"
- **Admin de Área** solo puede crear Editores dentro de su propio tenant
- El correo debe ser único en todo el sistema

### Activar/Desactivar usuarios

- Hacer clic en **"Desactivar"** o **"Activar"** en la fila del usuario
- Un usuario desactivado no puede iniciar sesión pero sus datos se conservan
- No se puede desactivar a uno mismo ni modificar a un Super Admin

### Tabla de usuarios

| Columna | Descripción |
|---------|-------------|
| Nombre | Nombre completo del usuario |
| Email | Correo de acceso |
| Rol | Super Admin / Admin de Área / Editor |
| Área | Tenant al que pertenece |
| Estado | Activo / Inactivo |

---

## Catálogo de Instrumentos

El catálogo muestra instrumentos disponibles para todos los tenants, organizados por visibilidad.

### Acceder al catálogo

1. En la barra de navegación, hacer clic en **"Catálogo"**

### Tipos de visibilidad

| Tipo | Quién lo crea | Quién lo ve | Uso |
|------|---------------|-------------|-----|
| **Template** | Solo Super Admin | Todos los tenants | Base para duplicar como instrumento propio |
| **Público** | Admin de Área | Todos los tenants | Puede ser usado (crear sesiones) por cualquier área |
| **Privado** | Admin de Área | Solo su tenant + Super Admin | Instrumento exclusivo del área |

### Filtrar en el catálogo

Botones de filtro rápido:
- **Todos**: muestra templates + públicos + privados accesibles
- **Templates**: solo templates (creados por Super Admin)
- **Públicos**: solo instrumentos públicos

### Usar un template como base

1. Buscar el template deseado en el catálogo
2. Hacer clic en **"📋 Usar como base"**
3. Ingresar el nombre para el nuevo instrumento
4. Se crea una copia completa (dimensiones, preguntas, escala, niveles) como instrumento **privado** en tu área
5. El nuevo instrumento es completamente independiente del template original

### Duplicar un instrumento público

1. Buscar el instrumento público en el catálogo
2. Hacer clic en **"Duplicar"**
3. Ingresar el nombre para la copia
4. Se crea como instrumento privado en tu área

### Cambiar la visibilidad de un instrumento

1. Ir a **Instrumentos → [Instrumento]** (página de gestión)
2. En la sección "Visibilidad", seleccionar el nuevo valor

**Restricciones:**
- Solo el **owner** (quien creó el instrumento) o **Super Admin** pueden cambiar la visibilidad
- Solo **Super Admin** puede marcar un instrumento como "Template"
- Si un instrumento ya es template, solo Super Admin puede modificar su visibilidad
- Los demás usuarios ven la visibilidad como badge de solo lectura

---

## Viewer Links (Enlace firmado para compartir resultados)

Los viewer links permiten compartir resultados consolidados de una sesión con personas externas **sin necesidad de que tengan cuenta** en el sistema.

### Generar un viewer link

1. En el detalle de una sesión, buscar la opción de compartir resultados
2. Configurar la expiración (por defecto 72 horas, máximo 30 días)
3. Se genera un enlace único tipo `/viewer/vl_xxxxx`

### Características del viewer link

| Aspecto | Comportamiento |
|---------|----------------|
| Autenticación | No requiere — acceso sin login |
| Expiración | Configurable (1-720 horas) |
| Revocación | Se puede revocar manualmente antes de que expire |
| Contenido | Muestra resultados consolidados (radar + tabla + madurez) |
| Seguridad | Token opaco no predecible, validación server-side |

### Estados del enlace

- **Válido**: muestra los resultados normalmente
- **Expirado**: muestra mensaje "Enlace expirado"
- **Revocado**: muestra mensaje "Enlace revocado"
- **Inválido**: muestra mensaje "Enlace no válido"

### ¿Quién puede generar viewer links?

Cualquier usuario con rol Super Admin, Admin de Área o Editor puede generar enlaces para sesiones de su tenant.

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

El método más práctico para configurar un instrumento masivamente es mediante un archivo Excel. También se puede editar visualmente desde la interfaz.

#### Editor Visual (UI)

Desde la página de gestión del instrumento:

**Dimensiones:**
- **Agregar**: botón "+ Agregar Dimensión" → ingresar nombre
- **Editar nombre**: click en el texto del nombre → editar inline → se guarda al salir del campo
- **Editar descripción**: click en el texto de la descripción → editar inline → se guarda al salir del campo
- **Cambiar color**: click en el cuadro de color → se abre un color picker para seleccionar el nuevo color (#RRGGBB)
- **Reordenar**: botones ▲/▼ para subir o bajar de posición
- **Eliminar**: botón ✕ (elimina dimensión y todas sus preguntas)

> **Nota sobre versionamiento**: Si el instrumento ya tiene respuestas registradas, agregar o eliminar una dimensión crea automáticamente una nueva versión (misma regla que la importación Excel). Las sesiones existentes permanecen ligadas a su versión original.

**Preguntas:**
- **Agregar**: botón "+ Agregar pregunta" dentro de cada dimensión
- **Editar texto**: click en el texto → editar inline → se guarda al salir del campo
- **Cambiar tipo**: selector dropdown (Likert / Sí-No / Texto) — siempre visible al lado de cada pregunta
- **Contribuye al puntaje**: checkbox que define si la pregunta se incluye en el cálculo del radar/promedio
- **Obligatoria**: checkbox que define si el encuestado debe responder para avanzar
- **Reordenar**: botones ▲/▼
- **Eliminar**: botón ✕

> **Nota**: Las preguntas de tipo "Texto libre" nunca contribuyen al puntaje del radar (solo se muestran como respuestas abiertas en los resultados).

#### Import/Export Excel (masivo)

1. Ir a **Instrumentos → [Instrumento] → Gestionar**
2. Hacer clic en **"📥 Exportar Excel"** para obtener la plantilla (si el instrumento ya tiene datos) o preparar un Excel con el formato esperado

#### Formato del Excel

El archivo debe tener **dos hojas**:

**Hoja 1: "Banco de Preguntas"** (o cualquier nombre que contenga "banco")

| Dimensión | Descripción Dimensión | Color | Orden Dimensión | Pregunta | Orden Pregunta | Tipo | Contribuye al Puntaje | Obligatoria |
|-----------|----------------------|-------|-----------------|----------|----------------|------|----------------------|-------------|
| Contexto | Evalúa el contexto... | #1B2A4A | 1 | Pregunta 1... | 1 | likert | sí | sí |
| Contexto | Evalúa el contexto... | #1B2A4A | 1 | Pregunta 2... | 2 | boolean | no | sí |
| Feedback | Ayúdanos a mejorar... | #7C2D12 | 3 | ¿Qué mejorarías? | 1 | text | no | no |

- **Dimensión**: nombre de la dimensión (se repite en cada fila de pregunta)
- **Descripción Dimensión**: texto descriptivo mostrado al encuestado
- **Color**: código hexadecimal para la UI (formato #RRGGBB)
- **Orden Dimensión**: número que define la secuencia de presentación
- **Pregunta**: texto de la afirmación a evaluar
- **Orden Pregunta**: número de orden dentro de la dimensión
- **Tipo** (opcional): `likert` (escala 1-5, default), `boolean` (sí/no), `text` (texto libre)
- **Contribuye al Puntaje** (opcional): `sí` (default) o `no` — si se incluye en el radar/promedio
- **Obligatoria** (opcional): `sí` (default) o `no` — si el encuestado debe responder

> Si no se incluyen las columnas Tipo, Contribuye o Obligatoria, se usan los valores por defecto (likert, sí, sí) — retrocompatible con Excels anteriores.

**Hoja 2: "Escala"** (o cualquier nombre que contenga "escala") — opcional

| Valor | Etiqueta | Descripción |
|-------|----------|-------------|
| 1 | Nada / No iniciado | No se cumple o se desconoce el tema |
| 2 | Incipiente | Se ha planteado de manera informal |
| 3 | En desarrollo | Existe avance parcial documentado |
| 4 | Establecido | Se cumple de forma consistente |
| 5 | Maduro / Optimizado | Institucionalizado y en mejora continua |

> Si no se incluye la hoja de Escala, se usan las etiquetas por defecto (Totalmente en desacuerdo → Totalmente de acuerdo).

**Hoja 3: "Niveles"** (o cualquier nombre que contenga "nivel") — opcional

| Nivel | Color | Promedio Mínimo | Promedio Máximo |
|-------|-------|-----------------|-----------------|
| Inicial | #EF4444 | 1.0 | 2.0 |
| En progreso | #F59E0B | 2.1 | 3.5 |
| Avanzado | #10B981 | 3.6 | 5.0 |

- **Nivel**: nombre del nivel de madurez (libre, ej: "Naciente", "Inicial", "Crítico")
- **Color**: código hexadecimal para la UI (formato #RRGGBB)
- **Promedio Mínimo**: desde qué promedio (inclusive) aplica este nivel
- **Promedio Máximo**: hasta qué promedio (inclusive) aplica este nivel

> Se pueden definir 2, 3, 5 o cualquier cantidad de niveles. Los rangos deben cubrir de 1.0 a 5.0 sin huecos. Si no se incluye la hoja de Niveles, se calculan automáticamente por tercios (1.0–2.3 Naciente, 2.4–3.6 Base, 3.7–5.0 Clase Mundial).

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
   - El campo de texto es ampliado (12 filas, fuente monospace) para facilitar la edición de prompts largos
   - Límite máximo: **6000 caracteres**
4. Hacer clic en **"Guardar"**

**Vista previa con markdown**: Una vez guardado, el prompt se muestra con formato markdown renderizado (negritas, listas, encabezados, etc.) con un toggle para expandir/colapsar el contenido completo.

**Comportamiento del prompt personalizado**:
- Si el prompt tiene más de 200 caracteres, se considera un **prompt personalizado** y la IA usará su propio formato de respuesta en lugar de la plantilla genérica del sistema.
- Cuando un instrumento tiene prompt personalizado, el sistema envía a la IA el **detalle por pregunta** (promedios individuales por pregunta, no solo por dimensión), permitiendo cálculos y análisis más granulares.
- Esto permite crear lógicas de negocio específicas dentro del prompt (ej: compuertas, arquetipos, reglas de clasificación) que la IA ejecutará con datos de alta resolución.

### Editar Escala de Valores (UI)

1. En la página de gestión del instrumento, sección **"Escala de Valores (1-5)"**
2. Editar la etiqueta y descripción de cada valor (1 a 5)
3. Hacer clic en **"Guardar Escala"**

> Si se dejan vacíos, se usan las etiquetas por defecto.

### Editar Niveles de Madurez (UI)

1. En la página de gestión del instrumento, sección **"Niveles de Madurez"**
2. Editar nombre, color (#RRGGBB), promedio mínimo y máximo de cada nivel
3. **Agregar nivel**: botón "+ Agregar Nivel"
4. **Eliminar nivel**: botón "Eliminar" en la fila
5. Hacer clic en **"Guardar Niveles"**

**Validaciones al guardar:**
- Los rangos no se pueden solapar
- Deben cubrir de 1.0 a 5.0 sin huecos
- El mínimo debe ser menor que el máximo
- Los colores deben ser hex válidos (#RRGGBB)
- Cada nivel debe tener nombre

### Duplicar un instrumento

1. En el catálogo de instrumentos, hacer clic en **"Duplicar"** en el instrumento deseado
2. Ingresar el nuevo nombre
3. Se copia completamente: dimensiones, preguntas, escala, niveles de madurez y expertise IA
4. El duplicado es independiente del original

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

### Filtrar sesiones

- **Búsqueda por nombre**: campo de texto que filtra instantáneamente
- **Filtro por estado**: dropdown con opciones Todas / Activas / Inactivas

### Compartir la sesión con participantes

Cada sesión genera automáticamente:
- Un **enlace único** (`/encuesta/{id-sesión}`)
- Un **código QR** visible en la tarjeta de la sesión

Para compartir:
- **Copiar URL**: botón dedicado que copia el enlace al portapapeles con un clic
- **Copiar QR como imagen**: botón que copia el código QR como imagen PNG al portapapeles (ideal para pegar en presentaciones, correos o documentos)
- Proyectar o imprimir el QR para que los participantes escaneen con su celular

**Metadata dinámica**: Cuando un participante recibe el enlace y lo previsualiza (en WhatsApp, Slack, Teams, etc.), la vista previa muestra el **nombre del instrumento** y el **nombre de la sesión** en lugar de texto genérico. Esto facilita la identificación del enlace compartido.

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

1. **Landing page**: ve el nombre del instrumento, descripción, cantidad de dimensiones/preguntas, tiempo estimado y botón "Comenzar Evaluación"
2. **Registro**: ingresa nombre y correo electrónico
3. **Evaluación**: responde las preguntas dimensión por dimensión (wizard con barra de progreso)
4. **Resultados**: al finalizar, ve inmediatamente su gráfico de radar, pie charts (si hay preguntas sí/no), respuestas abiertas y tabla de madurez

**Tipos de pregunta que puede encontrar:**

| Tipo | Presentación | Obligatoriedad |
|------|--------------|----------------|
| **Likert (1-5)** | Botones numéricos con etiquetas de escala | Configurable por pregunta |
| **Sí/No** | Dos botones: ✓ Sí / ✗ No | Configurable por pregunta |
| **Texto libre** | Textarea con máximo 500 caracteres | Opcional por defecto |

**Características:**
- Las preguntas opcionales muestran el indicador "(opcional)" y permiten avanzar sin responder
- Escala de valores con etiquetas visibles en cada paso (solo para preguntas Likert)
- Puede navegar hacia atrás para cambiar respuestas
- Si cierra el navegador antes de enviar, puede reanudar con el mismo correo
- Una vez enviada, no puede responder de nuevo (se muestra mensaje informativo)

**Visualización de resultados:**
- **Gráfico de radar**: muestra el promedio por dimensión (solo incluye preguntas Likert que contribuyen al puntaje)
- **Pie charts**: distribución Sí/No por cada pregunta boolean
- **Respuestas abiertas**: lista de textos agrupados por dimensión

---

## Niveles de Madurez

Los resultados se clasifican en niveles configurables por instrumento. Cada instrumento puede definir sus propios niveles con rangos y nombres personalizados.

**Ejemplo de configuración por defecto:**

| Nivel | Rango (promedio) | Significado |
|-------|------------------|-------------|
| 🔴 Naciente | 1.0 – 2.3 | Capacidad no desarrollada o incipiente |
| 🟡 Base | 2.4 – 3.6 | Capacidad en desarrollo con avances parciales |
| 🟢 Clase Mundial | 3.7 – 5.0 | Capacidad madura e institucionalizada |

**Ejemplo personalizado (4 niveles):**

| Nivel | Rango | Color |
|-------|-------|-------|
| Crítico | 1.0 – 1.5 | Rojo |
| Inicial | 1.6 – 2.5 | Naranja |
| En progreso | 2.6 – 3.8 | Amarillo |
| Optimizado | 3.9 – 5.0 | Verde |

Los niveles se configuran en la hoja "Niveles" del Excel de cada instrumento. Si no se definen, se usan tercios automáticos.

---

## Exportar Resultados a PDF

El portal permite descargar los resultados como archivo PDF con gráfico de radar y tabla de madurez.

### Desde la vista del encuestado

1. El encuestado completa la evaluación
2. En la página de resultados (`/resultados/{id}`), hacer clic en **"📄 Descargar PDF"**
3. Se genera un PDF con el gráfico de radar y la tabla de resumen

### Desde el panel admin (detalle de sesión)

1. En el detalle de una sesión, seleccionar un encuestado (o la vista consolidada)
2. Hacer clic en **"📄 Descargar PDF"** en la esquina superior del panel de resultados
3. El PDF incluye:
   - Título con nombre del instrumento y versión
   - Gráfico de radar
   - Tabla de resumen por dimensión con niveles de madurez

> El PDF se genera en formato A4 y pesa aproximadamente 1-2 MB.

---

## Tendencias por Instrumento

La vista de tendencias muestra la evolución de resultados de un instrumento a lo largo de todas sus sesiones.

### Acceder

1. Ir a **Instrumentos** desde la navegación
2. Hacer clic en **"📊 Tendencias"** en el instrumento deseado

### Visualización

Se muestran dos gráficos de barras agrupadas:

- **Promedio General por Sesión**: una barra por sesión mostrando el promedio global (escala 1-5)
- **Promedio por Dimensión**: un grupo de barras por sesión con una barra por cada dimensión (con colores)

Debajo de los gráficos se muestra una **tabla de datos** con los valores numéricos.

### Filtros disponibles

| Filtro | Descripción |
|--------|-------------|
| **Rango de fechas** | Desde/hasta para acotar el período de análisis |
| **Sesiones específicas** | Checkboxes para incluir/excluir sesiones individuales |
| **Todas / Ninguna** | Botones rápidos para seleccionar o deseleccionar todas |

> Solo se consideran encuestados que completaron la evaluación.

---

## Historial de Encuestados

Permite buscar un encuestado y ver su historial de participación en todas las sesiones donde ha respondido.

### Acceder

1. En la barra de navegación, hacer clic en **"Encuestados"**

### Buscar un encuestado

1. Ingresar email o nombre en el buscador (mínimo 2 caracteres)
2. Hacer clic en **"🔍 Buscar"**
3. Se muestran los resultados con cantidad de sesiones completadas por cada encuestado

### Ver historial

1. Hacer clic en un encuestado de la lista
2. Se muestra:
   - **Tabla cronológica**: sesión, instrumento (badge), fecha, puntaje total, nivel de madurez
   - **Radares independientes**: un gráfico de radar por cada sesión en la que participó (ordenados cronológicamente)

> La identificación del encuestado se hace por email exacto. Si un participante usó distintos correos en distintas sesiones, aparecerán como registros separados.

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
Sí. Cada instrumento puede tener sus propias etiquetas para los valores 1-5, configurables desde el Excel de importación (hoja "Escala").

**¿Puedo personalizar los niveles de madurez?**
Sí. Cada instrumento puede tener sus propios niveles con nombres, colores y rangos de promedio personalizados, configurables desde el Excel de importación (hoja "Niveles"). Se pueden definir 2, 3, 5 o cualquier cantidad de niveles.

**¿Puedo mezclar tipos de pregunta en un mismo instrumento?**
Sí. Cada pregunta puede ser Likert (1-5), Sí/No (boolean) o Texto libre. Se configuran individualmente desde el editor visual o la columna "Tipo" en el Excel.

**¿Las preguntas de texto libre afectan el radar?**
No. Las preguntas de texto libre nunca contribuyen al puntaje. Las preguntas Sí/No pueden configurarse para contribuir o no (por defecto no contribuyen).

**¿Puedo hacer preguntas opcionales?**
Sí. Cada pregunta puede marcarse como "no obligatoria". El encuestado puede avanzar sin responderla y la pregunta no afecta los cálculos si queda sin respuesta.

**¿Dónde veo el consumo de tokens de IA?**
En la navegación admin → "Consumo". Muestra sesiones creadas, análisis generados y tokens consumidos por modelo (Gemini/Groq) por cada usuario.

**¿Qué es un tenant/área?**
Un tenant es una división organizacional (ej: Human Capital, Educación, Arquitectura). Cada área tiene sus propios usuarios, sesiones e instrumentos privados aislados de otras áreas.

**¿Un usuario puede pertenecer a varias áreas?**
No. Cada usuario pertenece a un solo tenant. Solo el Super Admin es transversal (no pertenece a ningún tenant específico).

**¿Qué pasa si desactivo un área?**
Los usuarios de esa área pierden acceso al panel pero los datos (sesiones, instrumentos, resultados) se conservan intactos. Se pueden reactivar en cualquier momento.

**¿Cómo comparto resultados con un cliente sin darle acceso al panel?**
Usa un **Viewer Link**: genera un enlace firmado temporal desde el detalle de la sesión. El cliente accede a una página de solo lectura con los resultados consolidados, sin necesidad de cuenta.

**¿Cuánto dura un viewer link?**
Por defecto 72 horas (3 días). Se puede configurar entre 1 hora y 30 días (720 horas). También se puede revocar manualmente antes de que expire.

**¿Quién puede crear templates?**
Solo el Super Admin. Los templates son instrumentos base que cualquier área puede duplicar como propio.

---

## Consumo y Uso

La sección de **Consumo** (accesible desde la navegación admin) registra automáticamente:

- **Sesiones creadas**: cada vez que un admin/editor crea una nueva sesión
- **Análisis IA generados**: cada vez que se genera un análisis interpretativo
- **Tokens por modelo**: cantidad de tokens de entrada y salida consumidos por Gemini o Groq

### Vistas disponibles

| Vista | Contenido |
|-------|-----------|
| **Resumen por usuario** | Email, sesiones creadas, análisis generados, tokens desglosados por modelo |
| **Detalle de actividad** | Tabla cronológica: fecha, usuario, acción, modelo, tokens consumidos |

### Consumo por área (vista desde Tenants)

En la sección de **Áreas**, cada tarjeta de tenant muestra:
- Usuarios activos del área
- Sesiones activas vs límite configurado
- Análisis generados este mes vs límite mensual

> Los datos se registran automáticamente. No requiere configuración adicional.
