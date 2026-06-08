# Componentes de la Aplicación

## 1. SurveyPage (Página de Encuesta)
- **Propósito**: Interfaz pública donde el encuestado ingresa sus datos y responde la encuesta
- **Responsabilidades**:
  - Mostrar formulario de registro (nombre, correo)
  - Validar que la sesión esté activa
  - Presentar las dimensiones EA una por una (wizard/stepper)
  - Mostrar barra de progreso y descripción de cada dimensión
  - Permitir navegación adelante/atrás entre dimensiones
  - Enviar respuestas al backend al completar la última dimensión
  - Redirigir a resultados al completar

## 2. ResultsPage (Página de Resultados)
- **Propósito**: Mostrar el resultado del diagnóstico al encuestado
- **Responsabilidades**:
  - Obtener respuestas del encuestado
  - Renderizar gráfico de radar con Recharts
  - Mostrar tabla resumen con valores por dimensión

## 3. AdminLayout (Layout Admin)
- **Propósito**: Layout protegido para el panel de administración
- **Responsabilidades**:
  - Verificar autenticación via Supabase Auth
  - Renderizar navegación del admin
  - Redirigir a login si no autenticado

## 4. AdminDashboard (Dashboard Admin)
- **Propósito**: Vista principal del administrador
- **Responsabilidades**:
  - Mostrar lista de sesiones (activas/inactivas)
  - Permitir crear nuevas sesiones
  - Habilitar/deshabilitar sesiones
  - Mostrar QR del enlace de cada sesión

## 5. AdminSessionDetail (Detalle de Sesión)
- **Propósito**: Vista detallada de una sesión
- **Responsabilidades**:
  - Listar encuestados de la sesión
  - Ver respuestas por encuestado
  - Ver estadísticas agregadas

## 6. LoginPage (Página de Login)
- **Propósito**: Autenticación del administrador
- **Responsabilidades**:
  - Formulario email/password
  - Llamar a Supabase Auth
  - Redirigir al dashboard tras login exitoso

## 7. RadarChart (Componente de Gráfico)
- **Propósito**: Componente reutilizable de gráfico de radar
- **Responsabilidades**:
  - Recibir datos de dimensiones y valores
  - Renderizar gráfico de radar con Recharts
  - Configurar labels en español

## 8. QRCodeDisplay (Componente QR)
- **Propósito**: Generar y mostrar código QR
- **Responsabilidades**:
  - Recibir URL de la sesión
  - Renderizar código QR scaneable
