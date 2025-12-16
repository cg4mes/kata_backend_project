# 🎯 Sistema de Gestión de Indicadores QA - Backend

API REST robusta basada en NestJS para gestionar proyectos QA, indicadores de ejecución de pruebas y métricas a través de múltiples tipos de pipelines (regresión, rendimiento, seguridad).

[![NestJS](https://img.shields.io/badge/NestJS-11.0-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-orange.svg)](https://aws.amazon.com/lambda/)
[![DynamoDB](https://img.shields.io/badge/AWS-DynamoDB-blue.svg)](https://aws.amazon.com/dynamodb/)

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#️-arquitectura)
- [Requisitos Previos](#-requisitos-previos)
- [Inicio Rápido](#-inicio-rápido)
- [Desarrollo Local](#-desarrollo-local)
- [Pruebas](#-pruebas)
- [Calidad de Código](#-calidad-de-código)
- [Documentación de API](#-documentación-de-api)
- [Despliegue](#-despliegue)
- [Variables de Entorno](#-variables-de-entorno)
- [Estructura del Proyecto](#️-estructura-del-proyecto)

## ✨ Características

- **Gestión de Proyectos**: CRUD completo de proyectos QA con métricas automáticas
- **Soporte Multi-Pipeline**: Indicadores de regresión, rendimiento y seguridad
- **Cálculo de Métricas**: Tasas de éxito, cobertura, error rate y security score
- **Autenticación JWT**: Control de acceso basado en roles (Admin/Viewer)
- **Single Table Design**: DynamoDB optimizado con GSI para queries eficientes
- **Arquitectura Serverless**: AWS Lambda + DynamoDB con escalado automático
- **Validación de Datos**: class-validator para validación exhaustiva
- **Health Checks**: Monitoreo de estado de la aplicación
- **Documentación Swagger**: API docs interactiva en `/api`

## 🏗️ Arquitectura

### Arquitectura Serverless con AWS Lambda + DynamoDB

```
┌──────────────────────────────────────────────────────────────────┐
│                       FRONTEND (CloudFront + S3)                  │
│                          React + Vite SPA                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS API Calls
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                    API GATEWAY HTTP API                           │
│  - RESTful endpoints                                              │
│  - CORS configuration                                             │
│  - CloudWatch logging                                             │
└────────────────────────────┬─────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                      AWS LAMBDA FUNCTION                          │
│  - Runtime: Node.js 20.x                                          │
│  - Handler: lambda.handler                                        │
│  - Memory: 512 MB                                                 │
│  - Timeout: 30s                                                   │
│  - NestJS + Express (serverless-express)                          │
│  - JWT Auth + RBAC                                                │
└────────────────────────────┬─────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                       AMAZON DYNAMODB                             │
│  Table: kata-backend-{stage}                                      │
│  - Primary Key: PK (Hash), SK (Range)                             │
│  - GSI1: Email lookup for users                                   │
│  - GSI2: Product lookup for projects                              │
│  - Single Table Design pattern                                    │
│  - Billing: Pay-per-request                                       │
└──────────────────────────────────────────────────────────────────┘
                             ↕
┌──────────────────────────────────────────────────────────────────┐
│                   AWS SECRETS MANAGER                             │
│  - /kata/{stage}/jwt-secret                                       │
│  - Automatic rotation support                                     │
└──────────────────────────────────────────────────────────────────┘
                             ↕
┌──────────────────────────────────────────────────────────────────┐
│                     AMAZON CLOUDWATCH                             │
│  - Lambda execution logs                                          │
│  - API Gateway access logs                                        │
│  - Custom metrics & alarms                                        │
│  - Dashboard with key metrics                                     │
└──────────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

- **Framework**: NestJS 11.0
- **Runtime**: Node.js 20.x
- **Compute**: AWS Lambda (Serverless)
- **Database**: Amazon DynamoDB (NoSQL)
- **API Gateway**: API Gateway HTTP API
- **IaC**: AWS CDK (TypeScript)
- **Auth**: JWT + Role-Based Access Control
- **Monitoring**: CloudWatch Logs & Metrics

### Modelo de Datos (Single Table Design)

#### Users

```typescript
PK: 'USER#{username}';
SK: 'METADATA';
GSI1PK: 'EMAIL#{email}';
GSI1SK: 'USER#{username}';
Attributes: (id, username, email, password(hashed), role, createdAt);
```

#### Projects

```typescript
PK: 'PROJECT#{prefix}';
SK: 'METADATA';
GSI2PK: 'PRODUCT#{product}';
GSI2SK: 'PROJECT#{prefix}';
Attributes: (id, prefix, product, totalDefinedTests, createdAt, updatedAt);
```

#### Indicators (Test Runs)

```typescript
PK: "PROJECT#{projectId}"
SK: "INDICATOR#{timestamp}#{id}"
Attributes: id, projectId, pipelineType, executionDate, totalTests,
            passedTests, failedTests, errorRate, securityScore, etc.
```

### Ventajas de la Arquitectura

#### ✅ Económica

- **Pay-per-use**: Solo pagas por invocaciones reales
- **Sin servidores 24/7**: Elimina costos de infraestructura idle
- **DynamoDB on-demand**: Escala automáticamente sin provisioning
- **~50% más barato** que ECS/Fargate para cargas variables

#### ✅ Escalable

- Lambda escala de 0 a miles de invocaciones automáticamente
- DynamoDB maneja millones de requests/segundo
- API Gateway soporta tráfico masivo sin configuración

#### ✅ Serverless Real

- Infraestructura 100% gestionada por AWS
- Actualizaciones de seguridad automáticas
- Alta disponibilidad multi-AZ por defecto
- Zero server management

### Módulos

```
src/
├── lambda.ts              # Lambda handler entry point
├── main.ts                # Standalone server (desarrollo)
├── app.module.ts          # Root module
├── projects-module/       # Gestión de proyectos QA
├── indicators-module/     # Indicadores y métricas
├── users-module/          # Autenticación y autorización
├── health/                # Health check endpoints
└── common/
    └── datasources/
        └── dynamodb.datasource.ts  # DynamoDB access layer

infrastructure/            # AWS CDK Infrastructure as Code
├── bin/
│   └── app.ts            # CDK app entry point
└── lib/
    └── kata-backend-stack.ts  # Lambda + DynamoDB stack
```

## 📋 Requisitos Previos

- **Node.js** v20 o superior
- **npm** v9 o superior
- **Docker Desktop** (para DynamoDB Local)
- **AWS CLI** v2 (para deployment)
- **AWS CDK CLI** v2 (para infrastructure)

### Instalación de Herramientas

```bash
# Verificar Node.js
node --version  # Debe ser >= 20.x

# Instalar AWS CLI (macOS)
brew install awscli

# Instalar AWS CDK CLI
npm install -g aws-cdk

# Verificar instalaciones
aws --version
cdk --version
```

## 🚀 Inicio Rápido

### 1. Clonar e Instalar

```bash
git clone <repository-url>
cd kata_backend_project
npm install
```

### 2. Iniciar DynamoDB Local con Docker

```bash
docker compose up -d dynamodb-local
```

Esto iniciará DynamoDB Local en `http://localhost:8000`.

### 3. Configurar Variables de Entorno

El archivo `.env` ya está configurado con los valores apropiados para desarrollo local:

```env
# DynamoDB Local
DYNAMO_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE_NAME=kata-backend-local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Crear Tabla e Insertar Datos de Prueba

```bash
npm run db:setup
```

Este comando:

- Crea la tabla `kata-backend-local` con el esquema correcto (PK, SK, GSI1, GSI2)
- Inserta dos usuarios de prueba:
  - **Admin**: `admin@kata.com` / `admin123` (rol: admin)
  - **Usuario**: `user@kata.com` / `user123` (rol: user)

### 5. Iniciar el Servidor Backend

```bash
npm run start:dev
```

El servidor estará disponible en:

- **API**: `http://localhost:3000`
- **Swagger Docs**: `http://localhost:3000/api`

## 💻 Desarrollo Local

### 📝 Scripts Disponibles

| Comando               | Descripción                                             |
| --------------------- | ------------------------------------------------------- |
| `npm run db:init`     | Crea la tabla de DynamoDB (elimina la existente si hay) |
| `npm run db:seed`     | Inserta usuarios de prueba                              |
| `npm run db:setup`    | Ejecuta `db:init` + `db:seed`                           |
| `npm run start`       | Iniciar aplicación                                      |
| `npm run start:dev`   | Hot-reload development                                  |
| `npm run start:debug` | Debug mode                                              |
| `npm run build`       | Compilar para producción                                |
| `npm run format`      | Formatear con Prettier                                  |
| `npm run lint`        | ESLint                                                  |
| `npm run lint:fix`    | Auto-fix linting issues                                 |
| `npm run test`        | Unit tests                                              |
| `npm run test:watch`  | Watch mode                                              |
| `npm run test:cov`    | Con cobertura                                           |
| `npm run test:e2e`    | End-to-end tests                                        |

### 🗄️ Estructura de la Tabla DynamoDB

**Tabla**: `kata-backend-local`

- **Primary Key**:
  - `PK` (HASH)
  - `SK` (RANGE)

- **GSI1**: Índice para búsqueda por email
  - `GSI1PK` (HASH)
  - `GSI1SK` (RANGE)

- **GSI2**: Índice para búsqueda por producto
  - `GSI2PK` (HASH)

### 👤 Usuarios de Prueba

Después de ejecutar `npm run db:setup`, tendrás estos usuarios disponibles:

#### Administrador

- **Email**: admin@kata.com
- **Password**: admin123
- **Rol**: admin

#### Usuario Regular

- **Email**: user@kata.com
- **Password**: user123
- **Rol**: user

⚠️ **Importante**: Cambiar las contraseñas en producción.

### 🔧 Comandos Útiles de DynamoDB Local

```bash
# Verificar que DynamoDB Local está corriendo
docker ps | grep dynamodb

# Ver contenido de la tabla
aws dynamodb scan \
  --table-name kata-backend-local \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Detener DynamoDB
docker compose down

# Reiniciar DynamoDB
docker compose restart dynamodb-local

# Reset completo (borra todos los datos)
docker compose down
rm -rf dynamodb-data/*
docker compose up -d dynamodb-local
sleep 3
npm run db:setup
```

### 🐛 Solución de Problemas

#### Error: "The security token included in the request is invalid"

Esto ocurre cuando el backend intenta conectarse a AWS DynamoDB en lugar de DynamoDB Local.

**Solución**:

1. Asegúrate de que el archivo `.env` existe y contiene `DYNAMO_ENDPOINT=http://localhost:8000`
2. Reinicia el servidor backend: `npm run start:dev`

#### Error: "Cannot connect to DynamoDB"

**Solución**:

1. Verifica que DynamoDB Local esté ejecutándose:
   ```bash
   docker ps | grep dynamodb
   ```
2. Si no está ejecutándose, inícialo:
   ```bash
   docker compose up -d dynamodb-local
   ```

#### Error: "Table does not exist"

**Solución**:

```bash
npm run db:setup
```

#### Puerto 3000 ya en uso

**Solución**:

```bash
# macOS/Linux
lsof -ti :3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Ejecutar en Modo Local vs Lambda

```bash
# Modo servidor standalone (desarrollo)
npm run start:dev
# → http://localhost:3000

# Modo Lambda local (testing)
# Usar AWS SAM Local o Serverless Offline
sam local start-api
```

## 🧪 Pruebas

### Ejecutar Tests

```bash
# Tests unitarios
npm run test

# Watch mode (desarrollo)
npm run test:watch

# Cobertura de código
npm run test:cov

# Tests end-to-end
npm run test:e2e

# Debug tests
npm run test:debug
```

### Cobertura de Pruebas

Los reportes de cobertura se generan en:

- **Terminal**: Resumen en consola
- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info` (para CI/CD)

### Objetivo de Cobertura

- **Target**: >80% de cobertura
- **Crítico**: Lógica de negocio, servicios, DTOs
- **Opcional**: Controllers (cubiertos por e2e tests)

## 🔍 Calidad de Código

### ESLint

```bash
# Verificar código
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Prettier

```bash
# Formatear todos los archivos
npm run format

# Verificar formato
npm run format:check
```

### SonarQube

```bash
# Análisis de calidad (requiere SonarQube running)
sonar-scanner \
  -Dsonar.projectKey=kata_backend_project \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=YOUR_TOKEN
```

**Configuración**: Ver `sonar-project.properties`

### Métricas de Calidad

- ✅ **0 Bugs**: Código libre de bugs críticos
- ✅ **0 Vulnerabilities**: Sin vulnerabilidades de seguridad
- ✅ **0 Code Smells**: Código limpio y mantenible
- ✅ **Compilación Limpia**: Sin errores TypeScript
- ✅ **Linter Clean**: 0 errores ESLint

## 📚 Documentación de API

### Swagger/OpenAPI

Documentación interactiva disponible cuando la aplicación está corriendo:

**Local**: http://localhost:3000/api

La interfaz Swagger proporciona:

- Referencia completa de todos los endpoints
- Schemas de request/response
- Funcionalidad "Try it out"
- Testing de autenticación

### Endpoints Principales

```
POST   /auth/login                      # Autenticación
GET    /auth/profile                    # Perfil del usuario

GET    /projects                        # Listar proyectos
POST   /projects                        # Crear proyecto
GET    /projects/:id                    # Detalles del proyecto
GET    /projects/:id/metrics            # Métricas del proyecto
PUT    /projects/:id                    # Actualizar proyecto
DELETE /projects/:id                    # Eliminar proyecto

POST   /indicators/test-run             # Crear test run
GET    /indicators/project/:projectId   # Test runs del proyecto
DELETE /indicators/:id                  # Eliminar test run
DELETE /indicators/project/:projectId/all  # Eliminar todos los test runs

GET    /users                           # Listar usuarios (admin)
POST   /users                           # Crear usuario (admin)
GET    /users/:id                       # Detalles del usuario
PUT    /users/:id/role                  # Actualizar rol (admin)
DELETE /users/:id                       # Eliminar usuario (admin)

GET    /health                          # Health check
```

### Autenticación

Todos los endpoints (excepto `/auth/login` y `/health`) requieren JWT token:

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kata.com","password":"Admin@123"}'

# 2. Usar token en requests
curl http://localhost:3000/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📦 Despliegue

### Arquitectura de Deployment

```
GitHub → CodePipeline → CodeBuild → Lambda Function
                                          ↓
                                    DynamoDB
```

### Pre-requisitos de AWS

1. **AWS Account** con permisos de:
   - Lambda, API Gateway, DynamoDB
   - CloudWatch, Secrets Manager
   - IAM, CloudFormation

2. **AWS CLI configurado**:

```bash
aws configure
# AWS Access Key ID: YOUR_KEY
# AWS Secret Access Key: YOUR_SECRET
# Default region: us-east-1
```

3. **CDK Bootstrap** (primera vez):

```bash
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

### Deployment - Infraestructura (Una vez)

```bash
cd infrastructure
npm install

# Deploy staging
cdk deploy KataBackendStagingStack

# Deploy production
cdk deploy KataBackendProductionStack
```

Esto crea:

- Lambda function
- API Gateway
- DynamoDB table
- Secrets Manager secret
- CloudWatch logs & dashboard
- IAM roles & policies

### Deployment - Código Lambda

#### Opción 1: Manual

```bash
# Build
npm run build

# Crear ZIP
cd dist
zip -r ../lambda-deployment.zip .
cd ..
zip -r lambda-deployment.zip node_modules

# Deploy a Lambda
aws lambda update-function-code \
  --function-name kata-backend-staging \
  --zip-file fileb://lambda-deployment.zip \
  --region us-east-1
```

#### Opción 2: CI/CD con CodePipeline

```bash
# Push a branch específico
git push origin develop    # → QA
git push origin staging    # → Staging
git push origin main       # → Production
```

CodePipeline automáticamente:

1. Detecta cambios
2. Ejecuta CodeBuild con buildspec correspondiente
3. Compila TypeScript
4. Crea ZIP
5. Actualiza Lambda function

### Buildspecs por Ambiente

- `buildspec-lambda.yml` → Production
- `buildspec-lambda-qa.yml` → QA
- `buildspec-lambda-staging.yml` → Staging

### Verificar Deployment

```bash
# Obtener URL del API Gateway
aws cloudformation describe-stacks \
  --stack-name KataBackendStagingStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text

# Test health endpoint
curl https://YOUR_API_ENDPOINT/health
```

### Gestión de Secrets

```bash
# Ver JWT secret
aws secretsmanager get-secret-value \
  --secret-id /kata/staging/jwt-secret \
  --region us-east-1

# Actualizar secret
aws secretsmanager put-secret-value \
  --secret-id /kata/staging/jwt-secret \
  --secret-string "new-super-secret-key" \
  --region us-east-1
```

### Monitoreo Post-Deployment

**CloudWatch Dashboard** incluye:

- Lambda invocations & errors
- Lambda duration (p50, p90, p99)
- API Gateway requests & latency
- DynamoDB read/write capacity

**Logs**:

```bash
# Ver logs de Lambda
aws logs tail /aws/lambda/kata-backend-staging --follow

# Filtrar errores
aws logs filter-pattern /aws/lambda/kata-backend-staging \
  --filter-pattern "ERROR"
```

### Rollback

```bash
# Listar versiones de Lambda
aws lambda list-versions-by-function \
  --function-name kata-backend-staging

# Rollback a versión anterior
aws lambda update-alias \
  --function-name kata-backend-staging \
  --name CURRENT \
  --function-version 42  # versión anterior estable
```

### Estimación de Costos

| Servicio        | Uso                           | Costo Mensual |
| --------------- | ----------------------------- | ------------- |
| Lambda          | 1M requests, 512MB, 500ms avg | ~$4           |
| API Gateway     | 1M requests                   | ~$3.50        |
| DynamoDB        | 1M writes, 5M reads           | ~$5           |
| Secrets Manager | 1 secret                      | ~$0.40        |
| CloudWatch      | Logs + metrics                | ~$2           |
| **TOTAL**       |                               | **~$15/mes**  |

_Basado en uso moderado. Sin tráfico = ~$2.40/mes (solo Secrets + logs básicos)_

## 🔐 Variables de Entorno

### Archivo .env (Desarrollo Local)

```bash
# Application
NODE_ENV=development
PORT=3000

# DynamoDB Local
DYNAMODB_TABLE_NAME=kata-backend-local
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=24h

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

### Variables en AWS Lambda

Configuradas automáticamente por CDK:

- `NODE_ENV`: production/staging/qa
- `DYNAMODB_TABLE_NAME`: kata-backend-{stage}
- `AWS_REGION`: us-east-1
- `JWT_SECRET_ARN`: ARN del secret en Secrets Manager
- `CORS_ORIGINS`: URLs permitidas

### Generar JWT Secret Seguro

```bash
# Generar secret de 64 caracteres
openssl rand -base64 64

# Usar en .env o Secrets Manager
```

## 🗂️ Estructura del Proyecto

```
kata_backend_project/
├── src/
│   ├── app.module.ts                    # Root module
│   ├── main.ts                          # Standalone server entry
│   ├── lambda.ts                        # Lambda handler entry
│   │
│   ├── projects-module/
│   │   ├── projects.controller.ts       # REST endpoints
│   │   ├── projects.service.ts          # Business logic
│   │   ├── dto/                         # Data Transfer Objects
│   │   │   ├── create-project.dto.ts
│   │   │   ├── update-project.dto.ts
│   │   │   └── project-metrics.dto.ts
│   │   └── projects.module.ts
│   │
│   ├── indicators-module/
│   │   ├── indicators.controller.ts
│   │   ├── indicators.service.ts
│   │   ├── metrics-calculator.service.ts  # Cálculo de métricas
│   │   ├── dto/
│   │   │   ├── create-indicator.dto.ts
│   │   │   └── indicator.dto.ts
│   │   └── indicators.module.ts
│   │
│   ├── users-module/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── user-role.enum.ts            # ADMIN | VIEWER
│   │   ├── guards/
│   │   │   ├── auth.guard.ts            # JWT validation
│   │   │   └── roles.guard.ts           # RBAC
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── login-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   └── users.module.ts
│   │
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   │
│   └── common/
│       ├── constants/
│       │   └── error-messages.ts
│       └── datasources/
│           └── dynamodb.datasource.ts   # DynamoDB client wrapper
│
├── infrastructure/                       # AWS CDK IaC
│   ├── bin/
│   │   └── app.ts                       # CDK app
│   ├── lib/
│   │   └── kata-backend-stack.ts        # Stack definition
│   ├── cdk.json
│   ├── package.json
│   └── tsconfig.json
│
├── test/
│   ├── app.e2e-spec.ts                  # E2E tests
│   └── jest-e2e.json
│
├── ci-cd/                                # Scripts de deployment
│   ├── deploy.sh
│   ├── install-dependencies.sh
│   ├── local-build.sh
│   └── verify-deployment-config.sh
│
├── buildspec-lambda.yml                 # Production CodeBuild
├── buildspec-lambda-qa.yml              # QA CodeBuild
├── buildspec-lambda-staging.yml         # Staging CodeBuild
│
├── docker-compose.yml                   # DynamoDB Local
├── create-dynamodb-table.sh             # Setup script
│
├── .env.example                         # Environment template
├── eslint.config.mjs                    # ESLint config
├── .prettierrc                          # Prettier config
├── sonar-project.properties             # SonarQube config
│
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
└── README.md
```

## 🔒 Seguridad

### Implementadas

- ✅ **JWT Authentication**: Tokens seguros con expiración
- ✅ **Role-Based Access Control**: Admin/Viewer roles
- ✅ **Password Hashing**: bcrypt con salt rounds
- ✅ **Secrets Management**: AWS Secrets Manager
- ✅ **Input Validation**: class-validator en todos los DTOs
- ✅ **CORS Configurado**: Origenes permitidos por ambiente
- ✅ **Security Groups**: Acceso restringido en Lambda
- ✅ **HTTPS Only**: API Gateway con TLS
- ✅ **IAM Least Privilege**: Permisos mínimos necesarios

### Best Practices

1. **Nunca** commitear secrets en git
2. Rotar JWT secrets regularmente
3. Usar Secrets Manager para credentials
4. Habilitar CloudTrail para auditoría
5. Configurar WAF en API Gateway (producción)
6. Rate limiting en endpoints públicos
7. Input sanitization en todos los endpoints

## 🤝 Contribuir

### Workflow de Desarrollo

1. Fork del repositorio
2. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push a branch: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Convenciones de Código

- **Style Guide**: Seguir Airbnb TypeScript Style Guide
- **Commits**: Usar Conventional Commits
  - `feat:` nueva funcionalidad
  - `fix:` corrección de bug
  - `docs:` cambios en documentación
  - `refactor:` refactorización de código
  - `test:` agregar o actualizar tests
- **Linting**: Ejecutar `npm run lint:fix` antes de commit
- **Testing**: Mantener >80% cobertura
- **PR**: Incluir descripción detallada y screenshots si aplica

### Checklist Pre-PR

- [ ] Código compila sin errores (`npm run build`)
- [ ] Tests pasan (`npm run test`)
- [ ] Linter limpio (`npm run lint`)
- [ ] Cobertura >80% (`npm run test:cov`)
- [ ] Documentación actualizada
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] Commit messages siguen convención

## 📞 Soporte

### Issues

Para reportar bugs o solicitar features:

1. Verificar que no exista un issue similar
2. Crear nuevo issue con template apropiado
3. Incluir pasos para reproducir
4. Adjuntar logs relevantes

### Contacto

- **Equipo de Desarrollo**: [dev-team@example.com](mailto:dev-team@example.com)
- **Issues**: https://github.com/your-org/kata-backend/issues
- **Wiki**: https://github.com/your-org/kata-backend/wiki

## 📝 Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para historial de cambios.

## 📄 Licencia

Este proyecto es privado y propietario.

## 🔗 Recursos Útiles

### Documentación Oficial

- [NestJS Docs](https://docs.nestjs.com)
- [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [AWS CDK Docs](https://docs.aws.amazon.com/cdk/)
- [JWT.io](https://jwt.io) - JWT debugger

### Single Table Design

- [The DynamoDB Book](https://www.dynamodbbook.com)
- [AWS re:Invent - Advanced Design Patterns](https://www.youtube.com/watch?v=6yqfmXiZTlM)

### Serverless Best Practices

- [Serverless Architecture Patterns](https://serverlessland.com/patterns)
- [AWS Lambda Power Tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning)

---

**Construido con ❤️ usando NestJS + AWS Serverless**

_Última actualización: Diciembre 2025_
