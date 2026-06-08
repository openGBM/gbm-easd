# Reglas de Negocio v2.x — Multi-Instrumento

## Reglas de Instrumentos

| ID | Regla | Validación |
|----|-------|------------|
| BR-V2-01 | Solo instrumentos activos aparecen en el selector al crear sesión | Filtrar instruments WHERE is_active = true |
| BR-V2-02 | El instrumento seed no se puede eliminar | Verificar que no sea el instrumento con id del seed |
| BR-V2-03 | Solo admins pueden gestionar instrumentos | RLS + verificación auth en frontend |
| BR-V2-04 | Un instrumento debe tener al menos una versión para ser utilizable | Validar que exista instrument_versions con is_current = true |

## Reglas de Versionamiento

| ID | Regla | Validación |
|----|-------|------------|
| BR-V2-05 | Solo una versión por instrumento puede ser current | Al crear nueva: UPDATE is_current = false WHERE instrument_id = X, luego INSERT con is_current = true |
| BR-V2-06 | El version_number es auto-incremental | SELECT MAX(version_number) + 1 FROM instrument_versions WHERE instrument_id = X |
| BR-V2-07 | No se puede eliminar una versión con sesiones asociadas | Verificar COUNT(sessions) WHERE instrument_version_id = version.id |
| BR-V2-08 | Al crear nueva versión se duplica el banco como base | INSERT dimensions y questions copiando de la versión anterior |
| BR-V2-09 | Cada versión es inmutable una vez publicada | No se permite UPDATE a dimensions/questions de versiones no current |

## Reglas de Sesiones (v2.x)

| ID | Regla | Validación |
|----|-------|------------|
| BR-V2-10 | Al crear sesión con flag ON, se requiere seleccionar instrumento | Validar instrument_version_id NOT NULL cuando flag = ON |
| BR-V2-11 | La sesión se liga a la versión current del instrumento al momento de creación | SET instrument_version_id = versión con is_current = true del instrumento seleccionado |
| BR-V2-12 | No se puede cambiar el instrumento/versión de una sesión existente | No permitir UPDATE de instrument_version_id |
| BR-V2-13 | Sesiones sin instrument_version_id usan dimensiones globales (v1.x) | Lógica condicional en carga de encuesta |

## Reglas de Feature Flag

| ID | Regla | Validación |
|----|-------|------------|
| BR-V2-14 | Con flag OFF, el portal se comporta como v1.x | No mostrar selector, no mostrar badges, no mostrar tarjeta de instrumentos |
| BR-V2-15 | Con flag ON, se habilitan todas las funcionalidades multi-instrumento | Mostrar UI condicional en dashboard, crear sesión, listado |
| BR-V2-16 | El flag se gestiona desde Vercel Dashboard sin redeploy | Usar @flags-sdk/vercel con adaptador nativo |
| BR-V2-17 | En desarrollo local el flag se puede override via env var | Soportar MULTI_INSTRUMENT=true en .env.local como override |

## Reglas de Carga de Encuesta (v2.x)

| ID | Regla | Validación |
|----|-------|------------|
| BR-V2-18 | Si sesión tiene instrument_version_id: cargar dimensiones de esa versión | SELECT dimensions WHERE instrument_version_id = sesión.instrument_version_id |
| BR-V2-19 | Si sesión NO tiene instrument_version_id: cargar dimensiones seed | SELECT dimensions WHERE instrument_version_id IS NULL |
| BR-V2-20 | La experiencia del encuestado no cambia (transparente) | Mismo wizard, misma escala, mismo flujo |

## Reglas de Dashboard (v2.x)

| ID | Regla | Validación |
|----|-------|------------|
| BR-V2-21 | Con flag ON: tarjeta adicional "Instrumentos Disponibles" | COUNT instruments WHERE is_active = true |
| BR-V2-22 | Con flag ON: badge de instrumento/versión en listado de sesiones | JOIN sessions → instrument_versions → instruments |
| BR-V2-23 | Con flag ON: enlace a catálogo de instrumentos en navegación admin | Agregar link en AdminNav |
