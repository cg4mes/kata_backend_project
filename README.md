# 🎯 Sistema de Gestión de Indicadores QA - Backend

API REST robusta basada en NestJS para gestionar proyectos QA, indicadores de ejecución de pruebas y métricas a través de múltiples tipos de pipelines (regresión, rendimiento, seguridad).

[![NestJS](https://img.shields.io/badge/NestJS-11.0-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![DynamoDB](https://img.shields.io/badge/DynamoDB-Local-blue.svg)](https://aws.amazon.com/dynamodb/)

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#️-arquitectura)
- [Requisitos Previos](#-requisitos-previos)
- [Inicio Rápido](#-inicio-rápido)
- [Desarrollo Local](#-desarrollo-local)
- [Pruebas](#-pruebas)
- [Calidad de Código](#-calidad-de-código)
- [Documentación de API](#-documentación-de-api)
- [Variables de Entorno](#-variables-de-entorno)
- [Estructura del Proyecto](#️-estructura-del-proyecto)

## ✨ Características

- **Gestión de Proyectos**: CRUD completo de proyectos QA con métricas automáticas
- **Soporte Multi-Pipeline**: Indicadores de regresión, rendimiento y seguridad
- **Cálculo de Métricas**: Tasas de éxito, cobertura, error rate y security score
- **Autenticación JWT**: Control de acceso basado en roles (Admin/Viewer)
- **Single Table Design**: DynamoDB optimizado con GSI para queries eficientes
- **Validación de Datos**: class-validator para validación exhaustiva
- **Health Checks**: Monitoreo de estado de la aplicación
- **Documentación Swagger**: API docs interactiva en `/api`

## 🏗️ Arquitectura

### Stack Tecnológico

- **Framework**: NestJS 11.0
- **Runtime**: Node.js 20.x
- **Database**: DynamoDB (Local con Docker para desarrollo)
- **Auth**: JWT + Role-Based Access Control
- **Testing**: Jest + Supertest
- **Documentation**: Swagger/OpenAPI

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

### Módulos

```
src/
├── app.module.ts          # Root module
├── main.ts                # Standalone server entry
├── projects-module/       # Gestión de proyectos QA
├── indicators-module/     # Indicadores y métricas
├── users-module/          # Autenticación y autorización
├── health/                # Health check endpoints
└── common/
    └── datasources/
        └── dynamodb.datasource.ts  # DynamoDB access layer
```

## 📋 Requisitos Previos

- **Node.js** v20 o superior
- **npm** v9 o superior
- **Docker Desktop** (para DynamoDB Local)

### Instalación de Herramientas

```bash
# Verificar Node.js
node --version  # Debe ser >= 20.x

# Verificar Docker
docker --version
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
  - `GSI2SK` (RANGE)

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

### Ver Reporte de Cobertura

```bash
# Generar reporte de cobertura
npm run test:cov

# Abrir reporte HTML
open coverage/lcov-report/index.html
```

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

### SonarQube (Opcional)

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
  -d '{"email":"admin@kata.com","password":"admin123"}'

# 2. Usar token en requests
curl http://localhost:3000/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

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
│       ├── datasources/
│       │   └── dynamodb.datasource.ts   # DynamoDB client wrapper
│       ├── filters/
│       └── interceptors/
│
├── test/
│   ├── app.e2e-spec.ts                  # E2E tests
│   └── jest-e2e.json
│
├── scripts/
│   ├── init-dynamodb-local.ts           # Setup DynamoDB table
│   └── seed-database.ts                 # Seed test data
│
├── coverage/                             # Test coverage reports
├── dist/                                 # Compiled output
│
├── docker-compose.yml                   # DynamoDB Local
│
├── .env                                 # Environment variables
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
- ✅ **Input Validation**: class-validator en todos los DTOs
- ✅ **CORS Configurado**: Orígenes permitidos por ambiente
- ✅ **Security Headers**: Helmet middleware
- ✅ **Rate Limiting**: Protección contra ataques de fuerza bruta

### Best Practices

1. **Nunca** commitear secrets en git
2. Rotar JWT secrets regularmente
3. Usar variables de entorno para credentials
4. Input sanitization en todos los endpoints
5. Mantener dependencias actualizadas
6. Revisar logs de seguridad regularmente

## 🤝 Contribuir

### Workflow de Desarrollo

1. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`
2. Commit cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
3. Push a branch: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request

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
- **PR**: Incluir descripción detallada y tests

### Checklist Pre-PR

- [ ] Código compila sin errores (`npm run build`)
- [ ] Tests pasan (`npm run test`)
- [ ] Linter limpio (`npm run lint`)
- [ ] Cobertura >80% (`npm run test:cov`)
- [ ] Documentación actualizada
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] Commit messages siguen convención

## 🔗 Recursos Útiles

### Documentación Oficial

- [NestJS Docs](https://docs.nestjs.com)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [JWT.io](https://jwt.io) - JWT debugger

### Single Table Design

- [The DynamoDB Book](https://www.dynamodbbook.com)
- [AWS re:Invent - Advanced Design Patterns](https://www.youtube.com/watch?v=6yqfmXiZTlM)

---

**Construido con ❤️ usando NestJS + DynamoDB**
