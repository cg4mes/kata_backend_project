# Arquitectura Serverless - Kata Backend

## 🏗️ Nueva Arquitectura Lambda + Aurora Serverless v2

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USUARIOS FINALES                                │
│                     (ADMIN / VIEWER Roles)                               │
└──────────────────────────────┬──────────────────────────────────────────┘
                                │
                                │ HTTPS Requests
                                ↓
┌────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                      │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  CloudFront CDN                                               │     │
│  │  - SSL/TLS Termination                                        │     │
│  │  - Global Edge Caching                                        │     │
│  │  - DDoS Protection                                            │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                              ↓                                           │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  Amazon S3                                                    │     │
│  │  - Static Website Hosting                                     │     │
│  │  - React SPA (Vite)                                           │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                              │                                           │
│                              │ API Calls                                 │
└──────────────────────────────┼───────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────────┐
│                           BACKEND - SERVERLESS                          │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  Amazon Route 53                                              │     │
│  │  - DNS: api.kata.com                                          │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                              ↓                                           │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  API Gateway HTTP API                                         │     │
│  │  - RESTful endpoints                                          │     │
│  │  - CORS configuration                                         │     │
│  │  - Request/Response transformation                            │     │
│  │  - CloudWatch logging                                         │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                              ↓                                           │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    VPC (10.0.0.0/16)                              │ │
│  │                                                                     │ │
│  │  ┌──────────────────── Public Subnet ───────────────────────┐    │ │
│  │  │  - NAT Gateway (Elastic IP)                              │    │ │
│  │  │  - Internet Gateway (attached to VPC)                    │    │ │
│  │  └──────────────────────────────────────────────────────────┘    │ │
│  │                              ↕                                      │ │
│  │  ┌──────────────────── Private Subnet ──────────────────────┐    │ │
│  │  │                                                            │    │ │
│  │  │  ┌──────────────────────────────────────────────┐        │    │ │
│  │  │  │  AWS Lambda Function                          │        │    │ │
│  │  │  │  - Runtime: Node.js 20.x                     │        │    │ │
│  │  │  │  - Handler: lambda.handler                   │        │    │ │
│  │  │  │  - Memory: 1024 MB                           │        │    │ │
│  │  │  │  - Timeout: 30s                              │        │    │ │
│  │  │  │  - NestJS + Express (serverless-express)    │        │    │ │
│  │  │  │  - JWT Auth + RBAC                           │        │    │ │
│  │  │  │  - TypeORM + PostgreSQL driver              │        │    │ │
│  │  │  │  [SG: Allow outbound to DB, Secrets, NAT]  │        │    │ │
│  │  │  └──────────────────────────────────────────────┘        │    │ │
│  │  │                        ↓                                  │    │ │
│  │  └────────────────────────┼──────────────────────────────────┘    │ │
│  │                            ↓                                        │ │
│  │  ┌──────────────────── Isolated Subnet ────────────────────┐      │ │
│  │  │                                                           │      │ │
│  │  │  ┌──────────────────────────────────────────────┐       │      │ │
│  │  │  │  Aurora Serverless v2 (PostgreSQL 15.5)      │       │      │ │
│  │  │  │  - Cluster: kata-db-production               │       │      │ │
│  │  │  │  - Min Capacity: 0.5 ACUs                    │       │      │ │
│  │  │  │  - Max Capacity: 2 ACUs                      │       │      │ │
│  │  │  │  - Auto-scaling based on load                │       │      │ │
│  │  │  │  - Scales to near-zero when idle             │       │      │ │
│  │  │  │  - Tables: Users, Projects, Indicators       │       │      │ │
│  │  │  │  [SG: Allow port 5432 from Lambda SG only]  │       │      │ │
│  │  │  └──────────────────────────────────────────────┘       │      │ │
│  │  │                                                           │      │ │
│  │  └───────────────────────────────────────────────────────────┘      │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
                                ↕
┌────────────────────────────────────────────────────────────────────────┐
│                      AWS MANAGED SERVICES                               │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  AWS Secrets Manager                                          │     │
│  │  - /kata/production/database-credentials                      │     │
│  │  - /kata/production/jwt-secret                                │     │
│  │  - Automatic rotation (optional)                              │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                              ↕                                           │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  Amazon CloudWatch                                            │     │
│  │  - Lambda execution logs                                      │     │
│  │  - API Gateway access logs                                    │     │
│  │  - Custom metrics & alarms                                    │     │
│  │  - Dashboard with key metrics                                 │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                      CI/CD PIPELINE                                     │
│                                                                          │
│  GitHub/CodeCommit → CodePipeline → CodeBuild                           │
│                                       ↓                                  │
│                          Build TypeScript → Create ZIP                  │
│                                       ↓                                  │
│                          AWS Lambda Update Function                     │
│                                       ↓                                  │
│                          🎉 Deployment Complete                         │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘
```

## 📊 Comparación: ECS vs Lambda

| Aspecto | ECS + Fargate | Lambda + Aurora Serverless |
|---------|---------------|----------------------------|
| **Costo Mínimo** | ~$80/mes (24/7 running) | ~$40-50/mes (pay per use) |
| **Escalabilidad** | Manual/Auto-scaling | Automática e instantánea |
| **Cold Start** | No | 1-3 segundos |
| **Mantenimiento** | Medio (Docker, ECR, ECS) | Bajo (AWS managed) |
| **Límites** | Ninguno | 15 min timeout, 10 GB RAM |
| **Ideal para** | Alta carga continua | Uso esporádico |

## 🔑 Ventajas de la Arquitectura Lambda

### ✅ Económica
- **Sin costos 24/7**: Solo pagas por ejecuciones reales
- **Aurora Serverless v2**: Escala a 0.5 ACUs (~$0.06/hora en uso)
- **Sin ALB**: Elimina ~$18/mes del Application Load Balancer
- **Sin NAT pesado**: Un solo NAT Gateway suficiente

### ✅ Escalable
- Lambda escala automáticamente de 0 a miles de invocaciones
- Aurora escala verticalmente según la carga
- API Gateway maneja millones de requests

### ✅ Serverless Real
- Infraestructura gestionada por AWS
- Actualizaciones automáticas de seguridad
- Alta disponibilidad multi-AZ

### ✅ Fácil de mantener
- Despliegue con un solo ZIP
- No gestión de contenedores
- Logs centralizados en CloudWatch

## 🚀 Despliegue

### 1. Desplegar Infraestructura (una sola vez)
```bash
cd infrastructure
cdk deploy KataBackendProductionStack
```

### 2. Desplegar Código (cada cambio)
```bash
# Build
npm run build

# Update Lambda
aws lambda update-function-code \
  --function-name kata-backend-production \
  --zip-file fileb://lambda-deployment.zip
```

### 3. CI/CD (automático)
CodePipeline detecta cambios en GitHub y despliega automáticamente usando `buildspec-lambda.yml`.

## 📈 Monitoreo

**CloudWatch Dashboard** incluye:
- Lambda invocations count
- Lambda errors & duration
- API Gateway requests & latency
- Aurora database connections

**Alertas recomendadas**:
- Lambda errors > 5%
- Lambda duration > 25s
- API Gateway 5xx errors > 10
- Aurora CPU > 80%

## 🔒 Seguridad

- **Lambda en subnet privada**: Sin acceso directo a internet
- **Database en subnet aislada**: Solo Lambda puede conectarse
- **Secrets Manager**: Credenciales nunca en código
- **Security Groups**: Tráfico restringido por componente
- **IAM Roles**: Permisos de mínimo privilegio
- **API Gateway**: CORS configurado, rate limiting opcional

## 💡 Mejoras Futuras

1. **VPC Endpoints para ECR/Secrets**: Elimina costos de NAT Gateway
2. **Provisioned Concurrency**: Elimina cold starts (añade costo)
3. **Aurora Data API**: Conexiones HTTP sin pool de conexiones
4. **Lambda@Edge**: Lógica más cerca del usuario
5. **WAF en API Gateway**: Protección contra ataques web

## 📝 Notas

- **Cold start**: Primera request después de inactividad tarda 1-3s
- **Connection pooling**: Configurar correctamente TypeORM para Lambda
- **Timeout**: 30s máximo, suficiente para operaciones normales
- **Memoria**: 1024 MB, ajustable según necesidad real
