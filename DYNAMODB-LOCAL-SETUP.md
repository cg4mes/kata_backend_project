# DynamoDB Local Setup

Este proyecto usa **DynamoDB Local** para desarrollo, permitiendo desarrollar sin necesidad de conectarse a AWS.

## Requisitos

- Docker Desktop instalado y corriendo
- AWS CLI instalado (para crear las tablas)

## Instalación de AWS CLI (si no lo tienes)

### macOS
```bash
brew install awscli
```

### Verificar instalación
```bash
aws --version
```

## Iniciar DynamoDB Local

### 1. Iniciar Docker Desktop
Asegúrate de que Docker Desktop esté corriendo en tu Mac.

### 2. Levantar DynamoDB Local con Docker Compose
```bash
cd /Users/cristhianmartinez/Documents/Kata_files/kata_backend_project
docker-compose up -d
```

### 3. Verificar que está corriendo
```bash
docker ps | grep dynamodb
```

Deberías ver algo como:
```
kata-dynamodb-local   amazon/dynamodb-local:latest   Up X seconds   0.0.0.0:8000->8000/tcp
```

### 4. Crear la tabla
```bash
./create-dynamodb-table.sh
```

Esto creará la tabla `kata-backend-local` con la estructura Single Table Design:
- Primary Key: PK (Hash), SK (Range)
- GSI1: GSI1PK (Hash), GSI1SK (Range) - para buscar usuarios por email
- GSI2: GSI2PK (Hash), GSI2SK (Range) - para buscar proyectos por producto

## Comandos Útiles

### Listar tablas
```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1
```

### Ver contenido de la tabla
```bash
aws dynamodb scan --table-name kata-backend-local --endpoint-url http://localhost:8000 --region us-east-1
```

### Detener DynamoDB Local
```bash
docker-compose down
```

### Reiniciar DynamoDB Local (borra todos los datos)
```bash
docker-compose down -v
docker-compose up -d
./create-dynamodb-table.sh
```

## Estructura de la Tabla

### Users
- **PK**: `USER#{username}`
- **SK**: `USER#{username}`
- **GSI1PK**: `EMAIL#{email}`
- **GSI1SK**: `USER`

### Projects
- **PK**: `PROJECT#{prefix}`
- **SK**: `PROJECT#{prefix}`
- **GSI2PK**: `PRODUCT#{product}`
- **GSI2SK**: `PROJECT#{prefix}`

### Indicators (Test Runs)
- **PK**: `PROJECT#{projectId}`
- **SK**: `INDICATOR#{timestamp}#{id}`

## Configuración del Backend

El archivo `.env` ya está configurado para usar DynamoDB Local:

```env
DYNAMODB_TABLE_NAME=kata-backend-local
AWS_REGION=us-east-1
DYNAMO_ENDPOINT=http://localhost:8000
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
```

## Troubleshooting

### Error: "Cannot connect to Docker daemon"
- Asegúrate de que Docker Desktop esté corriendo
- En macOS, abre Docker Desktop desde Applications

### Error: "The security token included in the request is invalid"
- Esto significa que el backend no está usando DynamoDB Local
- Verifica que `.env` tenga `DYNAMO_ENDPOINT=http://localhost:8000`
- Reinicia el backend: `npm run start:dev`

### Error: "Requested resource not found"
- La tabla no existe en DynamoDB Local
- Ejecuta: `./create-dynamodb-table.sh`

### DynamoDB Local no responde
```bash
# Reiniciar
docker-compose restart

# Ver logs
docker-compose logs dynamodb-local
```

## Datos de Prueba

Para crear un usuario de prueba:

```bash
# Usando curl
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin123!",
    "role": "admin"
  }'
```

O directamente en DynamoDB Local:

```bash
aws dynamodb put-item \
    --table-name kata-backend-local \
    --endpoint-url http://localhost:8000 \
    --region us-east-1 \
    --item '{
        "PK": {"S": "USER#admin"},
        "SK": {"S": "USER#admin"},
        "GSI1PK": {"S": "EMAIL#admin@example.com"},
        "GSI1SK": {"S": "USER"},
        "username": {"S": "admin"},
        "email": {"S": "admin@example.com"},
        "password": {"S": "$2b$10$your-hashed-password-here"},
        "role": {"S": "admin"},
        "createdAt": {"S": "2025-12-15T23:00:00.000Z"},
        "updatedAt": {"S": "2025-12-15T23:00:00.000Z"}
    }'
```

## Migración a AWS

Cuando estés listo para desplegar a AWS:

1. Comenta o elimina `DYNAMO_ENDPOINT` del `.env`
2. Configura las credenciales de AWS:
   ```bash
   aws configure
   ```
3. Despliega la infraestructura con CDK:
   ```bash
   cd infrastructure
   npm run deploy
   ```
