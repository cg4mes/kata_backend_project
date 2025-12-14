# 🎯 Sistema de Gestión de Indicadores QA - Backend

API REST robusta basada en NestJS para gestionar proyectos QA, indicadores de ejecución de pruebas y métricas a través de múltiples tipos de pipelines (regresión, rendimiento, seguridad).

[![NestJS](https://img.shields.io/badge/NestJS-11.0-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3-orange.svg)](https://typeorm.io/)

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#️-arquitectura)
- [Requisitos Previos](#-requisitos-previos)
- [Inicio Rápido](#-inicio-rápido)
- [Desarrollo](#-desarrollo)
- [Pruebas](#-pruebas)
- [Calidad de Código](#-calidad-de-código)
- [Documentación de API](#-documentación-de-api)
- [Despliegue](#-despliegue)
- [Variables de Entorno](#-variables-de-entorno)
- [Estructura del Proyecto](#️-estructura-del-proyecto)

## ✨ Características

- **Gestión de Proyectos**: Crear, leer, actualizar y eliminar proyectos QA
- **Soporte Multi-Pipeline**: Manejo de indicadores de pruebas de regresión, rendimiento y seguridad
- **Cálculo de Métricas**: Cálculo automático de tasas de éxito, cobertura, tasas de error y puntajes de seguridad
- **Autenticación de Usuarios**: Autenticación JWT con control de acceso basado en roles (Admin/Visor)
- **Documentación de API**: Documentación interactiva Swagger/OpenAPI en `/api`
- **Validación de Datos**: Validación exhaustiva de entradas usando class-validator
- **Manejo de Errores**: Filtro global de excepciones para respuestas de error consistentes
- **Health Checks**: Endpoint integrado de verificación de salud para monitoreo
- **Flexibilidad de Base de Datos**: SQLite para desarrollo, PostgreSQL para producción
- **Arquitectura Modular**: Separación clara de responsabilidades con módulos de NestJS

## 🏗️ Arquitectura

### Módulos

```
src/
├── projects-module/      # Gestión de proyectos QA
├── indicators-module/    # Indicadores de pruebas y métricas
├── users-module/        # Autenticación y autorización
├── health/              # Endpoints de verificación de salud
└── common/              # Utilidades compartidas, filtros, interceptores
```

### Tecnologías Clave

- **NestJS** 11.0 - Framework progresivo de Node.js
- **TypeORM** 0.3.x - ORM con soporte para múltiples bases de datos
- **PostgreSQL** - Base de datos de producción
- **SQLite** - Base de datos de desarrollo
- **JWT** - Autenticación segura basada en tokens
- **Swagger/OpenAPI** - Documentación interactiva de API
- **class-validator** - Validación de DTOs
- **Jest** - Framework de pruebas

## 📋 Requisitos Previos

- **Node.js** v20 o superior
- **npm** o **yarn**
- **Docker** (opcional, para contenerización)
- **AWS CLI** (para despliegue en la nube)
- **PostgreSQL** (para entorno de producción)

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Entorno

Copia el archivo de entorno de ejemplo y configura tus variables:

```bash
cp .env.example .env
```

Edita `.env` con tu configuración local (base de datos, secreto JWT, etc.)

### 3. Ejecutar la Aplicación

```bash
# Modo desarrollo con recarga en caliente
npm run start:dev

# La API estará disponible en:
# http://localhost:3000
# Documentación Swagger en:
# http://localhost:3000/api
```

### 4. Usuario Admin por Defecto

La aplicación creará automáticamente un usuario administrador por defecto en el primer inicio:
- **Usuario**: `admin`
- **Contraseña**: `admin123`

⚠️ **¡Cambia la contraseña por defecto inmediatamente en producción!**

## 🔧 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run start          # Iniciar aplicación
npm run start:dev      # Iniciar con recarga en caliente
npm run start:debug    # Iniciar en modo debug

# Build
npm run build          # Compilar para producción

# Calidad de Código
npm run format         # Formatear código con Prettier
npm run lint           # Analizar código con ESLint
npm run lint:fix       # Corregir problemas de linting

# Pruebas
npm run test           # Ejecutar pruebas unitarias
npm run test:watch     # Ejecutar pruebas en modo watch
npm run test:cov       # Ejecutar pruebas con cobertura
npm run test:e2e       # Ejecutar pruebas end-to-end
```

### Usar Docker Localmente

```bash
# Construir imagen Docker
docker build -t kata-backend:local .

# Ejecutar contenedor con archivo de entorno
docker run -p 3000:3000 --env-file .env kata-backend:local

# O usando el script de compilación local
./ci-cd/local-build.sh qa
```

## 🧪 Pruebas

### Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas unitarias
npm run test

# Ejecutar pruebas en modo watch (desarrollo)
npm run test:watch

# Ejecutar pruebas con reporte de cobertura
npm run test:cov

# Ejecutar pruebas end-to-end
npm run test:e2e

# Depurar pruebas
npm run test:debug
```

### Cobertura de Pruebas

Después de ejecutar `npm run test:cov`, los reportes de cobertura estarán disponibles en:
- **Consola**: Resumen en terminal
- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info` (para herramientas CI/CD)

### Mejores Prácticas de Pruebas

- Escribe pruebas para toda la lógica de negocio
- Apunta a >80% de cobertura de código
- Usa mocks para dependencias externas
- Prueba casos límite y escenarios de error

## 🔍 Calidad de Código

### Análisis con SonarQube

Ejecuta análisis de calidad de código con SonarQube:

```bash
# Instalar scanner de SonarQube (si no está instalado)
npm install -g sonarqube-scanner

# Ejecutar análisis (reemplaza con tu token)
sonar-scanner -Dsonar.login=TU_TOKEN_SONARQUBE
```

**Configuración**: La configuración del proyecto está en `sonar-project.properties`

### Formateo de Código con Prettier

```bash
# Formatear todos los archivos
npm run format

# Verificar formateo
npm run format:check
```

### ESLint

```bash
# Ejecutar linter
npm run lint

# Corregir problemas auto-corregibles
npm run lint:fix
```

## � API Documentation

### Swagger/OpenAPI

Interactive API documentation is available when the application is running:

**Local**: [http://localhost:3000/api](http://localhost:3000/api)

The Swagger UI provides:
- Complete API reference for all endpoints
- Request/response schemas
- Try-it-out functionality
- Authentication testing

### Main API Endpoints

```
POST   /auth/login              # User authentication
POST   /auth/register           # User registration

GET    /projects                # List all projects
POST   /projects                # Create new project
GET    /projects/:id            # Get project details
PUT    /projects/:id            # Update project
DELETE /projects/:id            # Delete project

GET    /indicators              # List indicators
POST   /indicators              # Create indicator
GET    /indicators/project/:id  # Get project indicators

GET    /users                   # List users (admin only)
POST   /users                   # Create user (admin only)

GET    /health                  # Health check endpoint
```

## 📦 Despliegue

Este proyecto está configurado para despliegue en **AWS ECS/Fargate** con soporte para múltiples entornos.

### 📖 Documentación de Despliegue

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guía completa de despliegue con configuración paso a paso en AWS
- **[AWS_SETUP.md](./AWS_SETUP.md)** - Referencia rápida y estimaciones de costos

### 🚀 Despliegue Rápido

```bash
# 1. Verificar configuración
./ci-cd/verify-deployment-config.sh

# 2. Compilación y prueba local
./ci-cd/local-build.sh qa

# 3. Desplegar (crea tag de git y activa CI/CD)
./ci-cd/deploy.sh
```

### 🏗️ Configuración Inicial

1. **Configurar Infraestructura AWS** (configuración única)
   ```bash
   # Crear VPC, RDS, Cluster ECS, Repositorio ECR
   # Ver DEPLOYMENT.md para instrucciones detalladas
   ```

2. **Reemplazar Placeholders**
   ```bash
   # Reemplazar YOUR_AWS_ACCOUNT_ID en todos los archivos de configuración
   export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   find . -type f \( -name "*.yml" -o -name "*.json" \) -exec sed -i '' "s/YOUR_AWS_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" {} +
   ```

3. **Configurar Secretos en AWS SSM Parameter Store**
   ```bash
   aws ssm put-parameter --name /kata-backend/qa/db-password --value "TU_CONTRASEÑA" --type SecureString
   aws ssm put-parameter --name /kata-backend/qa/jwt-secret --value "TU_SECRETO_JWT" --type SecureString
   ```

### 🌍 Entornos

- **QA**: `pipeline/buildspecs/buildspec.qa.yml` + `pipeline/service/task-definition.qa.json`
- **Staging**: `pipeline/buildspecs/buildspec.staging.yml` + `pipeline/service/task-definition.staging.json`
- **Producción**: `buildspec.yml` + `task-definition.json`

## 🔐 Variables de Entorno

### Variables Requeridas

Crea un archivo `.env` (usa `.env.example` como plantilla):

```bash
# Aplicación
NODE_ENV=development          # development | production
PORT=3000                     # Puerto del servidor

# Base de Datos
DB_TYPE=sqlite                # sqlite | postgres | mysql
DB_HOST=localhost             # Para postgres/mysql
DB_PORT=5432                  # Puerto de la base de datos
DB_USERNAME=kata_user         # Usuario de la base de datos
DB_PASSWORD=your_password     # Contraseña de la base de datos
DB_DATABASE=kata_backend      # Nombre de la base de datos
DB_SYNCHRONIZE=true           # Auto-sincronizar esquema (¡solo dev!)
DB_LOGGING=false              # Habilitar logging SQL

# Autenticación JWT
JWT_SECRET=tu-clave-secreta-cambiar-en-produccion
JWT_EXPIRATION=24h            # Tiempo de expiración del token

# CORS
CORS_ORIGIN=http://localhost:5173    # URL del frontend

# Logging
LOG_LEVEL=debug               # error | warn | info | debug
```

### Archivos Específicos por Entorno

- `.env` - Desarrollo local (no en git)
- `.env.example` - Plantilla (en git)
- `.env.qa` - Placeholders de QA (excluido de git)
- `.env.staging` - Placeholders de Staging (excluido de git)
- `.env.production` - Placeholders de Producción (excluido de git)

⚠️ **¡Nunca hagas commit de archivos `.env` con credenciales reales a git!**

## 🗂️ Estructura del Proyecto

```
kata_backend_project/
├── src/
│   ├── projects-module/           # Gestión de proyectos
│   │   ├── projects.controller.ts
│   │   ├── projects.service.ts
│   │   ├── projects.entity.ts
│   │   └── dto/
│   ├── indicators-module/         # Indicadores de pruebas
│   │   ├── indicators.controller.ts
│   │   ├── indicators.service.ts
│   │   ├── indicators.entity.ts
│   │   └── metrics-calculator.service.ts
│   ├── users-module/              # Autenticación
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.entity.ts
│   ├── health/                    # Verificación de salud
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── common/                    # Código compartido
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── constants/
│   ├── app.module.ts              # Módulo principal
│   └── main.ts                    # Punto de entrada
├── test/                          # Pruebas E2E
├── pipeline/                      # Configuraciones de despliegue AWS
│   ├── buildspecs/
│   └── service/
├── ci-cd/                         # Scripts CI/CD
├── .env.example                   # Plantilla de entorno
├── Dockerfile                     # Imagen Docker de producción
├── nest-cli.json                  # Configuración de NestJS
├── package.json                   # Dependencias
├── tsconfig.json                  # Configuración de TypeScript
└── README.md                      # Este archivo
```

## 🤝 Contribuir

1. Haz fork del repositorio
2. Crea tu rama de funcionalidad (`git checkout -b feature/CaracteristicaIncreible`)
3. Haz commit de tus cambios (`git commit -m 'Agregar alguna CaracteristicaIncreible'`)
4. Haz push a la rama (`git push origin feature/CaracteristicaIncreible`)
5. Abre un Pull Request

### Guías de Desarrollo

- Sigue el estilo de código existente
- Escribe pruebas unitarias para nuevas funcionalidades
- Actualiza la documentación según sea necesario
- Ejecuta linting y pruebas antes de hacer commit

## 📝 Licencia

Este proyecto es privado y propietario.

## 📞 Soporte

Para problemas o preguntas:
- Crea un issue en el repositorio
- Contacta al equipo de desarrollo

## 🔗 Recursos Relacionados

- [Documentación de NestJS](https://docs.nestjs.com)
- [Documentación de TypeORM](https://typeorm.io)
- [Documentación de AWS ECS](https://docs.aws.amazon.com/ecs/)
- [JWT.io](https://jwt.io) - Depurador de JWT

---

**Construido con ❤️ usando NestJS**
