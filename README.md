# Portal de Autodiagnóstico de Arquitectura Empresarial (GBM-EASD)

Portal web de autodiagnóstico del nivel de madurez de Arquitectura Empresarial para clientes GBM. Permite evaluar rápidamente la eficacia de EA a través de una encuesta basada en el framework "EA in a Box 2.0".

## Descripción

Este portal permite a CTOs, CEOs y Managers de Banca, Seguros e Industria conocer su nivel de madurez en arquitectura empresarial de forma autónoma, sin depender de sesiones de consultoría presencial.

El encuestado selecciona un valor (1–5) que refleja su grado de acuerdo con la eficacia de su grupo de EA en cada dimensión. Al finalizar, se genera un gráfico de radar y una tabla resumen con los resultados.

## Funcionalidades principales

### Para el Encuestado
- Registro con nombre y correo electrónico
- Encuesta de madurez EA (8-10 dimensiones, escala 1-5)
- Acceso mediante enlace público o código QR
- Visualización inmediata de resultados (gráfico de radar + tabla resumen)

### Para el Administrador
- Gestión de sesiones (crear, habilitar, deshabilitar)
- Panel de administración con vista de encuestados y respuestas
- Generación de código QR por sesión
- Autenticación protegida con Supabase Auth

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React + Next.js (TypeScript) |
| Visualización | Recharts (gráfico de radar) |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Despliegue MVP | Supabase local |
| Lenguaje | TypeScript |

## Requisitos previos

- [Node.js](https://nodejs.org/) (v18+)
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado
- [Docker](https://www.docker.com/) (para Supabase local)

## Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd gbm-easd
```

2. Iniciar Supabase local:
```bash
supabase start
```

3. Instalar dependencias (cuando el frontend esté configurado):
```bash
npm install
```

4. Configurar variables de entorno:
```bash
cp .env.example .env.local
# Editar .env.local con las credenciales de Supabase local
```

5. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## Estructura del proyecto

```
gbm-easd/
├── docs/                    # Documentación del proyecto
├── Product-Definition/      # Definición de producto (visión, entrevistas)
├── aidlc-docs/              # Documentación del ciclo de desarrollo
│   └── inception/           # Fase de inception (planes, requerimientos)
├── supabase/                # Configuración de Supabase
│   ├── config.toml          # Configuración del proyecto
│   └── migrations/          # Migraciones de base de datos
├── examples/                # Ejemplos de uso
└── .kiro/                   # Configuración de Kiro IDE
```

## Modelo de datos

| Tabla | Descripción |
|-------|-------------|
| `sessions` | Sesiones de evaluación (activa/inactiva) |
| `respondents` | Encuestados (nombre, correo, sesión) |
| `responses` | Respuestas por dimensión (valor 1-5) |
| `dimensions` | Dimensiones de evaluación EA |

## Roadmap

- [x] Definición de producto y requerimientos
- [x] Migración de base de datos (modelo completo)
- [x] Frontend de encuesta (encuestado)
- [x] Panel de administración
- [x] Gráfico de radar con Recharts
- [ ] Despliegue en AWS (Fase 2)

## Licencia

Proyecto interno de GBM. Todos los derechos reservados.
