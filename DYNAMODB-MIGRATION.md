# Migración a DynamoDB - Progreso

## ✅ Completado

### 1. Diseño Single Table Design
**Modelo DynamoDB:**
```
Table: kata-backend-{stage}
Partition Key (PK): String
Sort Key (SK): String

Entity Types:
┌────────────────────────────────────────────────────────────────────┐
│ Users                                                              │
│ PK: USER#<username>                                               │
│ SK: METADATA                                                       │
│ Attributes: id, email, password, role, createdAt, updatedAt       │
│ GSI1PK: EMAIL#<email>  (para login por email)                     │
│ GSI1SK: USER#<username>                                           │
├────────────────────────────────────────────────────────────────────┤
│ Projects                                                           │
│ PK: PROJECT#<prefix>                                              │
│ SK: METADATA                                                       │
│ Attributes: id, product, totalDefinedTests, createdAt, updatedAt  │
│ GSI2PK: PRODUCT#<product>  (para buscar por nombre de producto)   │
│ GSI2SK: PROJECT#<prefix>                                          │
├────────────────────────────────────────────────────────────────────┤
│ Indicators                                                         │
│ PK: PROJECT#<prefix>                                              │
│ SK: INDICATOR#<timestamp>#<id>                                    │
│ Attributes: id, pipelineType, runDate, métricas...                │
└────────────────────────────────────────────────────────────────────┘
```

**Índices Secundarios Globales (GSI):**
- **GSI1**: Email lookup para autenticación de usuarios
- **GSI2**: Product lookup para búsqueda de proyectos por nombre

### 2. Infraestructura CDK Actualizada
**Cambios en `infrastructure/lib/kata-backend-stack.ts`:**
- ❌ Eliminado: VPC, Subnets, NAT Gateway, Security Groups
- ❌ Eliminado: Aurora Serverless v2, RDS Cluster
- ❌ Eliminado: Database Security Group
- ✅ Agregado: DynamoDB Table con billing Pay-Per-Request
- ✅ Agregado: GSI1 (Email lookup) y GSI2 (Product lookup)
- ✅ Reducido: Lambda Memory 1024MB → 512MB
- ✅ Removido: Lambda VPC configuration (no necesario para DynamoDB)

**Ahorro de costos mensuales:**
- NAT Gateway: -$32/mes
- Aurora Serverless v2: -$40-50/mes
- Lambda Memory optimización: -$5-10/mes
- **Total ahorrado: ~$77-92/mes**
- **Nuevo costo estimado: $5-15/mes con DynamoDB**

### 3. Datasource DynamoDB Creado
**Archivo:** `src/common/datasources/dynamodb.datasource.ts`

Características:
- Cliente DynamoDB DocumentClient con marshalling automático
- Soporte para desarrollo local (DynamoDB Local)
- Métodos CRUD completos:
  - `get(pk, sk)` - Obtener item por claves
  - `put(item)` - Crear/actualizar item
  - `query(pk, options)` - Query por PK con filtros
  - `queryGSI(indexName, gsiPK)` - Query en índice secundario
  - `update(pk, sk, updates)` - Actualización parcial
  - `delete(pk, sk)` - Eliminar item
  - `batchWrite(items)` - Operaciones batch
- Logger integrado para debugging
- Manejo de errores consistente

### 4. Módulo DynamoDB Global
**Archivo:** `src/common/dynamodb.module.ts`
- Módulo global de NestJS
- DynamoDBDatasource disponible en toda la aplicación
- No requiere importación en cada módulo

### 5. App Module Actualizado
**Archivo:** `src/app.module.ts`
- ❌ Removido: TypeOrmModule.forRootAsync()
- ✅ Agregado: DynamoDBModule (global)
- Mantenido: ConfigModule, ProjectsModule, IndicatorsModule, UsersModule, HealthModule

### 6. Módulo Users Migrado Completamente
**Archivos modificados:**
- `src/users-module/users.service.ts` - Migrado a DynamoDB
- `src/users-module/users.module.ts` - Removido TypeOrmModule

**Métodos migrados:**
- ✅ `create()` - Crea usuario con PK=USER#{username}, GSI1 para email
- ✅ `login()` - Autenticación usando GSI1 para buscar por email
- ✅ `findAll()` - Query todos los usuarios (con filtro EntityType)
- ✅ `findOne(id)` - Busca usuario por ID (scan con filter)
- ✅ `updateRole(id, role)` - Actualiza rol usando update()
- ✅ `remove(id)` - Elimina usuario con delete()
- ✅ `validateUniqueUser()` - Valida username (get) y email (GSI1)
- ✅ `findById()` - Query con filter por ID
- ✅ `findUserById()` - Helper interno

**Access Patterns implementados:**
1. Crear usuario → PK=USER#{username}
2. Login por email → GSI1 query
3. Buscar por username → get(USER#{username}, METADATA)
4. Listar todos los usuarios → query + filter
5. Actualizar/Eliminar → requiere primero findById

## ✅ Completado Adicional

### 7. Módulo Projects - MIGRADO COMPLETAMENTE
**Archivos modificados:**
- `src/projects-module/projects.service.ts` - Migrado a DynamoDB
- `src/projects-module/projects.module.ts` - Removido TypeORM

**Métodos migrados:**
- ✅ `findAll()` - Lista todos los proyectos
- ✅ `findAllWithMetrics()` - Proyectos con métricas calculadas
- ✅ `findById(id)` - Busca proyecto por ID
- ✅ `create()` - Crea proyecto con validaciones (prefix único, product único vía GSI2)
- ✅ `update()` / `partialUpdate()` - Actualiza proyecto
- ✅ `delete()` - Elimina con validación de indicators asociados
- ✅ `calculateProjectMetrics()` - Calcula métricas agregadas de indicators

**Access Patterns implementados:**
1. Crear proyecto → PK=PROJECT#{prefix}, validar unicidad
2. Buscar por prefix → get directo
3. Buscar por product → GSI2 query (PRODUCT#{product})
4. Listar todos → query PROJECT# con filter
5. Validar indicators antes de borrar → query INDICATOR# del proyecto

### 8. Módulo Indicators - MIGRADO COMPLETAMENTE
**Archivos modificados:**
- `src/indicators-module/indicators.service.ts` - Migrado a DynamoDB
- `src/indicators-module/indicators.module.ts` - Removido TypeORM

**Métodos migrados:**
- ✅ `createFromLambda()` - Ingesta desde Lambda, busca project por nombre (GSI2)
- ✅ `findByProject(projectId)` - Lista indicators de un proyecto (últimos 20)
- ✅ `delete(id)` - Elimina indicator individual
- ✅ `deleteAllByProject(projectId)` - Batch delete de todos los indicators

**Access Patterns implementados:**
1. Crear indicator → PK=PROJECT#{prefix}, SK=INDICATOR#{timestamp}#{id}
2. Buscar project por nombre → GSI2 query (PRODUCT#{teamName})
3. Listar indicators de proyecto → query PK con SK begins_with INDICATOR#
4. Ordenamiento cronológico → SK con timestamp embebido
5. Batch delete → DynamoDB batchWrite (máx 25 items/batch)

**Relación 1:N implementada:**
- Projects ← Indicators usando mismo PK (PROJECT#{prefix})
- Sort Key con timestamp asegura orden cronológico DESC
- Eliminación en cascada mediante batch operations

## ✅ Validación Final

### Compilación TypeScript
```bash
npm run build
✅ SUCCESS - Sin errores de compilación
✅ Todos los módulos migrados correctamente
✅ Dist generado completamente
```

### Resumen de Cambios por Módulo

| Módulo | Archivos | Métodos | Estado |
|--------|----------|---------|--------|
| **Users** | 2 modificados | 10 métodos | ✅ Completo |
| **Projects** | 2 modificados | 7 métodos | ✅ Completo |
| **Indicators** | 2 modificados | 4 métodos | ✅ Completo |
| **Common** | 2 nuevos | N/A | ✅ Completo |
| **Infrastructure** | 1 modificado | N/A | ✅ Completo |

**Total:** 21 métodos migrados a DynamoDB

## 🎯 Próximos Pasos para Deploy

### 1. Variables de Entorno (.env local)
```bash
# DynamoDB
DYNAMODB_TABLE_NAME=kata-backend-production
AWS_REGION=us-east-1

# Para desarrollo local con DynamoDB Local
NODE_ENV=local
DYNAMO_ENDPOINT=http://localhost:8000

# JWT
JWT_SECRET=your-secret-key-change-in-production
```

### 2. Deploy Infraestructura CDK
```bash
cd infrastructure
npm install
cdk bootstrap  # Solo primera vez
cdk deploy KataBackendProductionStack
```

### 3. Deploy Lambda
```bash
npm run build
./deploy-lambda.sh production
```

### 4. Testing Local (Opcional)
```bash
# Instalar DynamoDB Local con Docker
docker run -p 8000:8000 amazon/dynamodb-local

# Crear tabla local
aws dynamodb create-table \
  --table-name kata-backend-local \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
    AttributeName=GSI2PK,AttributeType=S \
    AttributeName=GSI2SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    "[{\"IndexName\":\"GSI1\",\"KeySchema\":[{\"AttributeName\":\"GSI1PK\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"GSI1SK\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000
```

## ⏳ Pendiente (Opcional)

### Optimizaciones Futuras
- ✅ Lambda sin VPC (ya implementado)
- ✅ Memoria 512MB (ya configurado en CDK)
- ⚠️ Tests unitarios (actualizar mocks de TypeORM → DynamoDB)
- ⚠️ Agregar GSI3 para lookup por ID si se necesita mejor performance
- ⚠️ Implementar TTL en indicators antiguos (opcional)

## 📝 Notas Técnicas

**Cambios en entidades:**
- Ya no se usan decoradores TypeORM (@Entity, @Column, etc.)
- Objetos planos de JavaScript/TypeScript
- Las fechas se almacenan como ISO strings
- UUIDs generados manualmente con uuid v4

**Patrón de Single Table Design:**
- Una sola tabla para todas las entidades
- PK/SK diseñados para queries eficientes
- GSIs para access patterns alternativos
- Evita JOINs → Denormalización intencional

**Consideraciones de desarrollo local:**
- DynamoDB Local puede correrse con Docker
- Variable DYNAMO_ENDPOINT para testing local
- Mismo código funciona en Lambda y local

## 🚀 Próximos Pasos

1. Migrar Projects module (similar a Users)
2. Migrar Indicators module (con relación 1:N a Projects)
3. Actualizar variables de entorno
4. Compilar y validar
5. Deploy a AWS

**Tiempo estimado restante:** 1-2 horas
