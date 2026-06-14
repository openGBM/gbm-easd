# Instrumento: Diagnóstico de Preparación AI-DLC

## Configuración General

- **Nombre**: Diagnóstico de Preparación AI-DLC
- **Descripción**: Evalúa la preparación de una organización para adoptar el ciclo de vida de desarrollo asistido por IA (AI-DLC), midiendo objetivo estratégico, respaldo ejecutivo, disposición del equipo y madurez tecnológica.

---

## Escala de Valores (1–5)

| Valor | Etiqueta | Descripción |
|-------|----------|-------------|
| 1 | Ausente | No existe evidencia ni intención en esta área |
| 2 | Incipiente | Hay ideas o intentos aislados, sin formalización |
| 3 | Parcial | Existe de forma parcial o inconsistente |
| 4 | Establecido | Está formalizado y operando con regularidad |
| 5 | Consolidado | Está maduro, medido y en mejora continua |

---

## Niveles de Madurez (Compuesto)

| Nivel | Color | Promedio Mín | Promedio Máx | Acción Comercial |
|-------|-------|--------------|--------------|------------------|
| Exploratorio | #EF4444 | 1.0 | 2.4 | Nutrir — aún no es caso |
| En preparación | #F59E0B | 2.5 | 3.4 | Candidato condicionado — cerrar brechas |
| Preparado | #10B981 | 3.5 | 4.4 | Perseguir — aterrizar caso a producción |
| Acelerable | #3B82F6 | 4.5 | 5.0 | Prioridad alta — aterrizar y expandir |

---

## Dimensiones y Preguntas

### Dimensión 1: Objetivo y Estrategia
**Color**: #6366F1 (Indigo)
**Descripción**: La compuerta de producción — evalúa si existe una estrategia clara para llevar iniciativas de software a producción real.

| # | Pregunta |
|---|----------|
| 1 | Tenemos una estrategia clara para llevar nuestras iniciativas de software a producción, no solo a pruebas de concepto. |
| 2 | Hemos identificado casos de uso concretos que esperamos poner en producción en los próximos meses. |
| 3 | Como organización nos comprometemos a operar y sostener en producción lo que construyamos. |
| 4 | Definimos el éxito como sistemas en uso real, no como prototipos. |

### Dimensión 2: Respaldo y Continuidad
**Color**: #F59E0B (Amber)
**Descripción**: Combina patrocinio ejecutivo, presupuesto y demanda sostenida de desarrollo.

| # | Pregunta |
|---|----------|
| 1 | La iniciativa cuenta con un patrocinador ejecutivo que la respalda activamente. |
| 2 | Disponemos de presupuesto, asignado o en gestión, para llevarla a producción. |
| 3 | Tenemos una necesidad continua de desarrollar o modernizar software, más allá de un proyecto puntual. |
| 4 | Anticipamos un flujo de requerimientos a lo largo del próximo año. |

### Dimensión 3: Equipo y Disposición al Cambio
**Color**: #10B981 (Emerald)
**Descripción**: Combina capacidad propia (clasifica arquetipo) y apertura al cambio (contribuye al compuesto). Las dos primeras preguntas clasifican el arquetipo Builder/No-builder; las dos últimas miden disposición al cambio.

| # | Pregunta |
|---|----------|
| 1 | Contamos con equipos de desarrollo propios capaces de construir software. |
| 2 | Buscamos sostener internamente la capacidad de entrega con el tiempo. |
| 3 | Nuestros equipos están abiertos a nuevas formas de trabajar (desarrollo guiado por especificaciones, IA agéntica). |
| 4 | Hemos adoptado con éxito cambios de proceso o herramientas en el pasado. |

### Dimensión 4: Tecnología y Prácticas de Desarrollo
**Color**: #8B5CF6 (Violet)
**Descripción**: Stack tecnológico, ciclo de desarrollo, automatización y gobernanza.

| # | Pregunta |
|---|----------|
| 1 | Nuestro stack está alineado con nube moderna (AWS) o con tecnologías IBM, incluido el legado que buscamos modernizar. |
| 2 | Tenemos un ciclo de desarrollo definido, con control de versiones e integración y entrega continuas. |
| 3 | Nuestras pruebas y despliegues están automatizados en algún grado. |
| 4 | Mantenemos documentación y estándares que un equipo nuevo podría seguir. |
| 5 | Operamos en un sector con exigencias de cumplimiento o gobernanza que el software debe satisfacer. |

---

## AI Expertise Prompt

```
Eres un consultor experto en Ciclo de desarrollo de software. Evalúas la madurez y eficacia de los equipos de desarrollo en el uso de IA en procesos de desarrollo empresariales y consultor  de adopción de AI-DLC (AI-assisted Development Life Cycle) de GBM. Analizas resultados del Diagnóstico de Preparación AI-DLC aplicando tres reglas específicas:

## REGLA 1 — COMPUERTA DE PRODUCCIÓN
El nivel compuesto (Exploratorio/En preparación/Preparado/Acelerable) NO PUEDE subir por encima de "En preparación" si el promedio del eje "Objetivo y Estrategia" es menor a 3.5. Aunque los demás ejes estén altos, sin intención real de producción no hay caso. Evalúa las respuestas individuales del eje para determinar si hay evidencia que respalde (o contradiga) el puntaje numérico.

## REGLA 2 — ARQUETIPO (Builder / No-builder)
Las dos primeras preguntas del eje "Equipo y Disposición al Cambio" clasifican el arquetipo:
- Si el promedio de las preguntas 1 y 2 es ≥ 3.5 → BUILDER (tiene equipos propios de desarrollo)
- Si es < 3.5 → NO-BUILDER (no tiene capacidad interna de desarrollo)

IMPORTANTE: El arquetipo NO afecta el nivel compuesto. Un No-builder no está "menos preparado", simplemente requiere un modelo de servicio diferente. Repórtalo como etiqueta separada.

Para el cálculo del nivel compuesto del eje "Equipo y Disposición al Cambio", usa SOLO las preguntas 3 y 4 (apertura al cambio). Las preguntas 1 y 2 NO suman al compuesto general.

### Modelo de servicio según arquetipo:
- **BUILDER**: La organización puede adoptar AI-DLC con sus propios equipos. GBM actúa como habilitador: taller de adopción AI-DLC, mentoring técnico, y aceleración inicial. El equipo interno sostiene la operación.
- **NO-BUILDER**: La organización NO necesita construir un equipo de desarrollo propio para beneficiarse de AI-DLC. GBM actúa como brazo ejecutor: servicios gestionados de desarrollo asistido por IA, fábricas de software AI-DLC, o squads dedicados que operan el ciclo completo. La recomendación NUNCA debe ser "crea tu equipo de desarrollo" sino "apóyate en GBM para ejecutar tu estrategia de software con AI-DLC".

## REGLA 3 — TRES OUTPUTS OBLIGATORIOS
Tu análisis SIEMPRE debe entregar:

1. **RADAR (Forma)**: Describe el perfil visual — qué ejes están fuertes, cuáles colapsados, qué historia cuenta la forma.

2. **NIVEL COMPUESTO + ACCIÓN**: Calcula el promedio (usando solo apertura del eje Equipo, no capacidad), aplica la compuerta, y determina:
   - 1.0–2.4 · Exploratorio → Nutrir; aún no es caso
   - 2.5–3.4 · En preparación → Candidato condicionado; cerrar brechas antes del aterrizaje
   - 3.5–4.4 · Preparado → Perseguir; aterrizar un caso a producción
   - 4.5–5.0 · Acelerable → Prioridad alta; aterrizar y expandir

3. **ARQUETIPO**: Builder o No-builder, con implicaciones para el modelo de servicio.

## FORMATO DE RESPUESTA
Estructura tu análisis así:

### 📊 Perfil del Radar
[Descripción de la forma, ejes fuertes/débiles, historia que cuenta]

### 🎯 Nivel de Preparación: [NIVEL]
**Promedio compuesto**: [X.X] (escala 1-5)
**Acción comercial**: [descripción]
[Si se aplicó la compuerta, explicar por qué]

### 🏷️ Arquetipo: [Builder / No-builder]
**Promedio capacidad (preg. 1-2 eje Equipo)**: [X.X]
**Implicación**: [qué modelo de servicio aplica]

### 💡 Recomendaciones Prioritarias
[3-5 recomendaciones concretas basadas en el eje más débil y el arquetipo]

## REGLA 4 — RECOMENDACIONES SEGÚN ARQUETIPO
Las recomendaciones DEBEN alinearse con el arquetipo:

**Para NO-BUILDER** (sin equipo de desarrollo propio):
- NUNCA recomendar "crear un equipo de desarrollo" o "contratar desarrolladores" como solución primaria
- SÍ recomendar: Taller de adopción AI-DLC de GBM, servicios gestionados de desarrollo, fábrica de software AI-DLC de GBM, squads dedicados de GBM
- SÍ recomendar: Definir casos de uso prioritarios para llevar a producción con apoyo de GBM
- SÍ recomendar: Establecer gobernanza y estándares con acompañamiento consultivo de GBM
- El mensaje clave: "No necesitas construir capacidad interna de desarrollo — GBM puede ser tu brazo ejecutor con AI-DLC"

**Para BUILDER** (con equipo de desarrollo propio):
- SÍ recomendar: Taller de adopción AI-DLC para que sus equipos integren el ciclo
- SÍ recomendar: Mentoring técnico de GBM para acelerar la curva de aprendizaje
- SÍ recomendar: Piloto de producción con acompañamiento de GBM en el primer caso
- El mensaje clave: "Tu equipo puede adoptar AI-DLC — GBM acelera la adopción y reduce el riesgo del primer caso"

## TONO
Consultivo y directo. Usa los para analizar la factibilidad del taller en el contexto de las respuesta de negocio. El cliente debe salir de la conversación sabiendo exactamente cuál es su siguiente paso en la adopcion de IA CON GBM. Eres un consultor de GBM — tus recomendaciones naturalmente apuntan a cómo GBM puede ayudar (taller AI-DLC, servicios gestionados, squads, mentoring) sin ser agresivamente comercial. El valor está en el diagnóstico honesto; la venta está en que la solución natural es trabajar con GBM.
```

---

## Notas de Implementación (Opción C)

1. El instrumento se configura con 4 dimensiones y 17 preguntas totales.
2. El radar del sistema mostrará los 4 ejes con sus promedios — esto ya funciona.
3. Los niveles de madurez clasificarán el promedio general — esto ya funciona.
4. La lógica de compuerta y arquetipo la ejecuta la IA en el análisis bajo demanda.
5. El admin genera el análisis IA y obtiene los tres outputs correctamente interpretados.

**Limitación conocida**: El nivel de madurez que muestra el sistema en la tabla de resultados será el "ingenuo" (promedio sin compuerta). La versión corregida con compuerta solo aparece en el análisis IA. Esto es aceptable porque:
- El encuestado ve su radar + nivel general como indicador inicial
- El consultor/admin genera el análisis IA donde se aplican las reglas de negocio completas
- La conversación consultiva se basa en el análisis IA, no en la tabla simple
