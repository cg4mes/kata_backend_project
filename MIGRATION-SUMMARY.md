# 🔄 Migración a Arquitectura Serverless - Resumen de Cambios

## ✅ Archivos Eliminados (Obsoletos)

### Relacionados con Docker/ECS:
- ❌ `Dockerfile` - Ya no usamos contenedores Docker
- ❌ `.dockerignore` - No necesario sin Docker
- ❌ `task-definition.json` - Definición de tareas ECS
- ❌ `setup-ecs-public.sh` - Script de configuración ECS
- ❌ `buildspec.yml` - BuildSpec para Docker/ECR

### Pipeline antiguo:
- ❌ `pipeline/service/task-definition.qa.json`
- ❌ `pipeline/service/task-definition.staging.json`
- ❌ `pipeline/buildspecs/buildspec.qa.yml` (Docker)
- ❌ `pipeline/buildspecs/buildspec.staging.yml` (Docker)
- ❌ `ci-cd/` - Scripts de CI/CD para Docker

## ✅ Archivos Nuevos (Lambda + CDK)

### Adaptador Lambda:
- ✅ `src/lambda.ts` - Handler Lambda con serverless-express

### Infraestructura como Código:
- ✅ `infrastructure/bin/app.ts` - CDK app entry point
- ✅ `infrastructure/lib/kata-backend-stack.ts` - Stack completo (VPC, Lambda, Aurora, etc.)
- ✅ `infrastructure/cdk.json` - Configuración CDK
- ✅ `infrastructure/tsconfig.json` - TypeScript config para CDK
- ✅ `infrastructure/README.md` - Documentación de infraestructura

### CI/CD para Lambda:
- ✅ `buildspec-lambda.yml` - Build para Lambda (production)
- ✅ `buildspec-lambda-qa.yml` - Build para Lambda (QA)
- ✅ `buildspec-lambda-staging.yml` - Build para Lambda (Staging)

### Scripts de Despliegue:
- ✅ `deploy-lambda.sh` - Script para desplegar código Lambda
- ✅ `deploy-infrastructure.sh` - Script para desplegar infraestructura CDK

### Documentación:
- ✅ `ARCHITECTURE-LAMBDA.md` - Documentación completa de arquitectura serverless
- ✅ `README.md` - Actualizado para reflejar arquitectura Lambda

## 📊 Comparación: Antes vs Ahora

| Aspecto | Antes (ECS + Docker) | Ahora (Lambda + CDK) |
|---------|----------------------|----------------------|
| **Archivos de config** | 15+ archivos | 8 archivos |
| **Complejidad** | Alta (Docker, ECR, ECS, ALB) | Media (Lambda, API Gateway) |
| **Despliegue** | Docker build + push + ECS update | ZIP + Lambda update |
| **Costo mensual** | ~$80-120 | ~$40-60 |
| **Mantenimiento** | Alto | Bajo |
| **Infraestructura** | Manual o scripts bash | IaC con CDK (TypeScript) |

## 🚀 Próximos Pasos

### 1. Instalar dependencias globales:
```bash
npm install -g aws-cdk
```

### 2. Desplegar infraestructura (una sola vez):
```bash
./deploy-infrastructure.sh production
```

Esto creará:
- VPC con subredes públicas, privadas y aisladas
- Lambda function (Node.js 20.x)
- API Gateway HTTP API
- Aurora Serverless v2 (PostgreSQL)
- Security Groups
- Secrets Manager
- CloudWatch Dashboard

### 3. Desplegar código (cada cambio):
```bash
./deploy-lambda.sh production
```

### 4. Actualizar frontend:
Cambiar la URL del API en tu frontend a la URL de API Gateway que obtendrás del output de CDK.

## 💡 Ventajas de la Nueva Arquitectura

✅ **50-65% más económico** para uso esporádico  
✅ **Infraestructura como código** (CDK) - reproducible y versionable  
✅ **Sin gestión de contenedores** - menos complejidad  
✅ **Escalabilidad automática** - Lambda + Aurora Serverless  
✅ **Despliegue más rápido** - ZIP en lugar de Docker image  
✅ **Menos archivos** - configuración más simple  

## 📝 Notas Importantes

### Cold Starts
Lambda tiene "cold start" (1-3 segundos) en la primera request después de estar inactivo. Para una herramienta Kata de uso esporádico, esto es aceptable y más económico que mantener ECS corriendo 24/7.

### Límites de Lambda
- Timeout máximo: 15 minutos
- Memoria máxima: 10 GB
- Tamaño de package: 250 MB (sin comprimir)

Para tu aplicación NestJS, estos límites son más que suficientes.

### Base de Datos
Aurora Serverless v2 escala desde 0.5 ACUs (muy económico) hasta 2 ACUs según la carga. Cuando no hay actividad, permanece en el mínimo.

## 🔄 Rollback

Si necesitas volver a la arquitectura anterior:
1. Los archivos Docker/ECS están en el historial de Git
2. Puedes hacer `git revert` de estos cambios
3. O mantener ambas ramas (main: Lambda, ecs-legacy: ECS)

## 📚 Recursos

- [Documentación completa](ARCHITECTURE-LAMBDA.md)
- [README actualizado](README.md)
- [Infraestructura CDK](infrastructure/README.md)
