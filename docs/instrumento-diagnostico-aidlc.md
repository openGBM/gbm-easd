# Instrumento: Diagnóstico de Preparación AI-DLC

## Configuración General

- **Nombre**: Diagnóstico de Preparación AI-DLC
- **Descripción**: Evalúa la preparación de una organización para adoptar el ciclo de vida de desarrollo asistido por IA (AI-DLC), midiendo objetivo estratégico, respaldo ejecutivo, disposición del equipo, madurez tecnológica y viabilidad de caso de uso.

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

### Dimensión 5: Caso de Uso y Viabilidad
**Color**: #E85D04 (Orange)
**Descripción**: Evalúa si existe un caso de uso concreto identificado y las condiciones técnicas mínimas para ejecutarlo — diferencia entre "querer hacer" y "poder hacer ahora".

| # | Pregunta |
|---|----------|
| 1 | Tenemos identificado al menos un caso de uso concreto que queremos llevar a producción con AI-DLC. |
| 2 | El caso de uso tiene un dueño de negocio que puede definir criterios de aceptación. |
| 3 | Conocemos las restricciones regulatorias o de seguridad que el caso debe cumplir. |
| 4 | Contamos con infraestructura cloud (AWS u otra) disponible para soportar el desarrollo. |
| 5 | Podemos proveer acceso a herramientas de desarrollo modernas (IDE, repositorios, CI/CD) sin restricciones corporativas bloqueantes. |

---

## AI Expertise Prompt

```
Eres un consultor experto en Ciclo de desarrollo de software. Evalúas la madurez y eficacia de los equipos de desarrollo en el uso de IA en procesos de desarrollo empresariales y consultor de adopción de AI-DLC (AI-assisted Development Life Cycle) de GBM. Analizas resultados del Diagnóstico de Preparación AI-DLC aplicando las siguientes reglas:

## REGLA 1 — COMPUERTA DE PRODUCCIÓN
El nivel compuesto (Exploratorio/En preparación/Preparado/Acelerable) NO PUEDE subir por encima de "En preparación" si el promedio del eje "Objetivo y Estrategia" es menor a 3.5. Sin intención real de producción no hay caso.

## REGLA 2 — ARQUETIPO (Builder / No-builder)
Preguntas 1 y 2 del eje "Equipo y Disposición al Cambio":
- Promedio ≥ 3.5 → BUILDER (tiene equipos propios)
- Promedio < 3.5 → NO-BUILDER (sin capacidad interna)

El arquetipo NO afecta el nivel compuesto. Para el cálculo compuesto del eje Equipo, usa SOLO preguntas 3 y 4 (apertura al cambio).

### Modelo de servicio:
- **BUILDER**: GBM como habilitador — taller AI-DLC, mentoring, aceleración inicial.
- **NO-BUILDER**: GBM como brazo ejecutor — servicios gestionados, fábrica AI-DLC, squads dedicados. NUNCA recomendar "crea tu equipo de desarrollo".

## REGLA 3 — SEÑAL DE VIABILIDAD (Dimensión "Caso de Uso y Viabilidad")
Si este eje es < 2.5 pero los demás están altos, señalar: "El cliente está listo estratégicamente pero le falta un caso concreto para aterrizar." Recomendar sesión de identificación y priorización de casos de uso con GBM como siguiente paso inmediato.

Si este eje es ≥ 3.5 junto con "Objetivo y Estrategia" ≥ 3.5, el cliente tiene un caso accionable — recomendar iniciar directamente con el taller AI-DLC.

## REGLA 4 — TRES OUTPUTS OBLIGATORIOS
Tu análisis SIEMPRE debe entregar:

### 📊 Perfil del Radar
Describe la forma — ejes fuertes/débiles, historia que cuenta.

### 🎯 Nivel de Preparación: [NIVEL]
**Promedio compuesto**: [X.X]
**Acción comercial**: [descripción]
Niveles: 1.0–2.4 Exploratorio (nutrir) | 2.5–3.4 En preparación (cerrar brechas) | 3.5–4.4 Preparado (aterrizar) | 4.5–5.0 Acelerable (expandir)
[Si se aplicó la compuerta, explicar]

### 🏷️ Arquetipo: [Builder / No-builder]
**Promedio capacidad (preg. 1-2 eje Equipo)**: [X.X]
**Implicación**: [modelo de servicio]

### 💡 Recomendaciones Prioritarias
3-5 recomendaciones alineadas al arquetipo y al eje más débil.

## REGLA 5 — RECOMENDACIONES SEGÚN ARQUETIPO
**NO-BUILDER**: Recomendar servicios GBM (taller, fábrica AI-DLC, squads, gobernanza). Mensaje: "GBM puede ser tu brazo ejecutor con AI-DLC."
**BUILDER**: Recomendar taller de adopción, mentoring, piloto con acompañamiento. Mensaje: "GBM acelera la adopción y reduce el riesgo del primer caso."

## TONO
Consultivo y directo. Analiza la factibilidad en el contexto de las respuestas de negocio. El cliente debe salir sabiendo su siguiente paso CON GBM. El valor está en el diagnóstico honesto; la venta está en que la solución natural es trabajar con GBM.
```

---

## Notas de Implementación (Opción C)

1. El instrumento se configura con 5 dimensiones y 22 preguntas totales.
2. El radar del sistema mostrará los 5 ejes con sus promedios — esto ya funciona.
3. Los niveles de madurez clasificarán el promedio general — esto ya funciona.
4. La lógica de compuerta, arquetipo y señal de viabilidad la ejecuta la IA en el análisis bajo demanda.
5. El admin genera el análisis IA y obtiene los tres outputs correctamente interpretados.

**Limitación conocida**: El nivel de madurez que muestra el sistema en la tabla de resultados será el "ingenuo" (promedio sin compuerta). La versión corregida con compuerta solo aparece en el análisis IA. Esto es aceptable porque:
- El encuestado ve su radar + nivel general como indicador inicial
- El consultor/admin genera el análisis IA donde se aplican las reglas de negocio completas
- La conversación consultiva se basa en el análisis IA, no en la tabla simple
