# Métodos de Componentes

## SurveyPage

| Método | Input | Output | Propósito |
|--------|-------|--------|-----------|
| validateSession(sessionId) | string | boolean | Verificar que la sesión existe y está activa |
| registerRespondent(name, email, sessionId) | string, string, string | Respondent | Crear registro del encuestado |
| submitResponses(respondentId, responses[]) | string, {dimensionId, value}[] | void | Guardar todas las respuestas |

## ResultsPage

| Método | Input | Output | Propósito |
|--------|-------|--------|-----------|
| getRespondentResults(respondentId) | string | {dimension, value}[] | Obtener respuestas para graficar |
| formatRadarData(results) | {dimension, value}[] | RadarChartData | Transformar datos para Recharts |
| calculateMaturityLevel(results) | {dimension, value}[] | {total, level} | Calcular suma y nivel (Naciente/Base/Clase Mundial) |

## AdminDashboard

| Método | Input | Output | Propósito |
|--------|-------|--------|-----------|
| getSessions() | void | Session[] | Listar todas las sesiones |
| createSession(name) | string | Session | Crear nueva sesión |
| toggleSession(sessionId, isActive) | string, boolean | void | Habilitar/deshabilitar sesión |
| getSessionUrl(sessionId) | string | string | Generar URL pública de la sesión |

## AdminSessionDetail

| Método | Input | Output | Propósito |
|--------|-------|--------|-----------|
| getSessionRespondents(sessionId) | string | Respondent[] | Listar encuestados de una sesión |
| getRespondentResponses(respondentId) | string | Response[] | Ver respuestas de un encuestado |

## LoginPage

| Método | Input | Output | Propósito |
|--------|-------|--------|-----------|
| signIn(email, password) | string, string | AuthSession | Autenticar admin via Supabase |
| signOut() | void | void | Cerrar sesión |

## RadarChart

| Método | Input | Output | Propósito |
|--------|-------|--------|-----------|
| render(data, dimensions) | RadarChartData, string[] | JSX | Renderizar gráfico de radar |

## QRCodeDisplay

| Método | Input | Output | Propósito |
|--------|-------|--------|-----------|
| generateQR(url) | string | JSX | Generar y mostrar código QR |
