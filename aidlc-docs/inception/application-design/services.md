# Servicios de la Aplicación

## 1. SessionService
- **Propósito**: Gestionar el ciclo de vida de las sesiones de encuesta
- **Responsabilidades**:
  - CRUD de sesiones
  - Control de estado (activa/inactiva)
  - Generación de URLs únicas por sesión
- **Interacciones**: Supabase DB (tabla `sessions`)

## 2. RespondentService
- **Propósito**: Gestionar el registro y datos de los encuestados
- **Responsabilidades**:
  - Registrar nuevo encuestado (nombre, correo, sesión)
  - Consultar encuestados por sesión
- **Interacciones**: Supabase DB (tabla `respondents`), SessionService (validar sesión activa)

## 3. ResponseService
- **Propósito**: Gestionar las respuestas de la encuesta
- **Responsabilidades**:
  - Guardar respuestas (respondent_id, dimension_id, value)
  - Consultar respuestas por encuestado
  - Consultar respuestas agregadas por sesión
- **Interacciones**: Supabase DB (tabla `responses`), RespondentService

## 4. DimensionService
- **Propósito**: Gestionar las dimensiones de evaluación EA
- **Responsabilidades**:
  - Obtener lista de dimensiones con nombre y descripción
  - Ordenar dimensiones para presentación
- **Interacciones**: Supabase DB (tabla `dimensions`)

## 5. AuthService
- **Propósito**: Gestionar autenticación de administradores
- **Responsabilidades**:
  - Login con email/password
  - Verificar sesión activa
  - Logout
- **Interacciones**: Supabase Auth

---

## Patrón de Orquestación

```
[Encuestado]
    → SurveyPage
        → SessionService.validate()
        → RespondentService.register()
        → DimensionService.getAll()
        → ResponseService.submit()
    → ResultsPage
        → ResponseService.getByRespondent()
        → RadarChart.render()

[Admin]
    → LoginPage
        → AuthService.signIn()
    → AdminDashboard
        → SessionService.getAll()
        → SessionService.create()
        → SessionService.toggle()
    → AdminSessionDetail
        → RespondentService.getBySession()
        → ResponseService.getByRespondent()
```
