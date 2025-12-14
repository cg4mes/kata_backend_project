# Kata Backend - Deployment Guide

Esta guía detalla todos los pasos necesarios para desplegar el backend de Kata a los ambientes de QA, Staging y Producción en AWS.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Configuración de AWS](#configuración-de-aws)
- [Configuración de Secrets](#configuración-de-secrets)
- [Pipeline de CI/CD](#pipeline-de-cicd)
- [Proceso de Deployment](#proceso-de-deployment)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos Previos

### Herramientas Necesarias
- AWS CLI configurado con credenciales válidas
- Docker instalado localmente
- Git configurado con acceso al repositorio
- Node.js v20 o superior
- Acceso a la consola AWS con permisos adecuados

### Permisos AWS Requeridos
- IAM: Crear roles y políticas
- ECR: Crear repositorios y push de imágenes
- ECS: Crear clusters, servicios y task definitions
- RDS: Crear instancias de PostgreSQL
- VPC: Configurar subnets, security groups
- Systems Manager (SSM): Crear parámetros
- CodePipeline/CodeBuild: Crear y gestionar pipelines
- CloudWatch: Ver logs y crear alarmas

---

## ☁️ Configuración de AWS

### 1. Configuración de Red (VPC)

Cada ambiente debe tener su propia configuración de red:

#### QA Environment
```bash
# Crear VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=kata-backend-qa-vpc},{Key=Environment,Value=qa}]'

# Crear subnets (mínimo 2 para Fargate)
aws ec2 create-subnet --vpc-id <VPC_ID> --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=kata-backend-qa-subnet-1}]'
aws ec2 create-subnet --vpc-id <VPC_ID> --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=kata-backend-qa-subnet-2}]'

# Crear Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=kata-backend-qa-igw}]'
aws ec2 attach-internet-gateway --vpc-id <VPC_ID> --internet-gateway-id <IGW_ID>

# Crear Security Group para ECS
aws ec2 create-security-group --group-name kata-backend-qa-ecs-sg --description "Security group for Kata Backend QA ECS tasks" --vpc-id <VPC_ID>

# Permitir tráfico HTTP/HTTPS al ECS
aws ec2 authorize-security-group-ingress --group-id <SG_ID> --protocol tcp --port 3000 --cidr 0.0.0.0/0
```

**Repetir para Staging y Production** con diferentes rangos de IP.

### 2. Configuración de RDS (Base de Datos)

#### Crear Security Group para RDS
```bash
aws ec2 create-security-group --group-name kata-backend-qa-rds-sg --description "Security group for Kata Backend QA RDS" --vpc-id <VPC_ID>

# Permitir conexiones desde ECS
aws ec2 authorize-security-group-ingress --group-id <RDS_SG_ID> --protocol tcp --port 5432 --source-group <ECS_SG_ID>
```

#### Crear RDS Instance para QA
```bash
aws rds create-db-instance \
  --db-instance-identifier kata-backend-qa-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username kata_admin \
  --master-user-password <STRONG_PASSWORD> \
  --allocated-storage 20 \
  --vpc-security-group-ids <RDS_SG_ID> \
  --db-subnet-group-name <DB_SUBNET_GROUP> \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --multi-az false \
  --publicly-accessible false \
  --storage-encrypted \
  --tags Key=Environment,Value=qa Key=Project,Value=kata-backend
```

**Para Staging y Production**: Usar instancias más grandes (`db.t3.small` o superior) y habilitar `multi-az true`.

### 3. Configuración de ECR (Container Registry)

```bash
# Crear repositorio ECR
aws ecr create-repository \
  --repository-name kata-backend \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  --tags Key=Environment,Value=all Key=Project,Value=kata-backend

# Obtener URI del repositorio
aws ecr describe-repositories --repository-names kata-backend --query 'repositories[0].repositoryUri' --output text
```

### 4. Configuración de IAM Roles

#### Task Execution Role (para que ECS pueda ejecutar las tareas)
```bash
# Crear rol
aws iam create-role \
  --role-name kata-backend-ecs-execution-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Adjuntar políticas necesarias
aws iam attach-role-policy --role-name kata-backend-ecs-execution-role --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Política custom para SSM Parameter Store
aws iam put-role-policy \
  --role-name kata-backend-ecs-execution-role \
  --policy-name SSMParameterAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameters",
        "ssm:GetParameter",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:ssm:us-east-1:*:parameter/kata/*"
    }]
  }'
```

#### Task Role (para permisos de la aplicación en runtime)
```bash
aws iam create-role \
  --role-name kata-backend-ecs-task-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Agregar políticas según necesidades (S3, DynamoDB, etc.)
```

### 5. Configuración de ECS Cluster

```bash
# Crear cluster para QA
aws ecs create-cluster \
  --cluster-name kata-backend-qa-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  --tags key=Environment,value=qa key=Project,value=kata-backend

# Repetir para Staging y Production
aws ecs create-cluster --cluster-name kata-backend-staging-cluster --capacity-providers FARGATE
aws ecs create-cluster --cluster-name kata-backend-production-cluster --capacity-providers FARGATE
```

### 6. Configuración de Application Load Balancer (ALB)

```bash
# Crear ALB
aws elbv2 create-load-balancer \
  --name kata-backend-qa-alb \
  --subnets <SUBNET_ID_1> <SUBNET_ID_2> \
  --security-groups <ALB_SG_ID> \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --tags Key=Environment,Value=qa

# Crear Target Group
aws elbv2 create-target-group \
  --name kata-backend-qa-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id <VPC_ID> \
  --target-type ip \
  --health-check-enabled \
  --health-check-protocol HTTP \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Crear Listener
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=<TG_ARN>
```

### 7. CloudWatch Log Groups

```bash
# Crear log groups
aws logs create-log-group --log-group-name /aws/ecs/kata-backend-qa
aws logs create-log-group --log-group-name /aws/ecs/kata-backend-staging
aws logs create-log-group --log-group-name /aws/ecs/kata-backend-production

# Configurar retención (30 días para QA, 90 para prod)
aws logs put-retention-policy --log-group-name /aws/ecs/kata-backend-qa --retention-in-days 30
aws logs put-retention-policy --log-group-name /aws/ecs/kata-backend-staging --retention-in-days 60
aws logs put-retention-policy --log-group-name /aws/ecs/kata-backend-production --retention-in-days 90
```

---

## 🔐 Configuración de Secrets

Todos los secrets y configuraciones sensibles se almacenan en AWS Systems Manager Parameter Store:

### Crear Parámetros para QA

```bash
# Database
aws ssm put-parameter --name /kata/qa/db_host --value "kata-backend-qa-db.xxxxx.us-east-1.rds.amazonaws.com" --type String
aws ssm put-parameter --name /kata/qa/db_username --value "kata_user" --type String
aws ssm put-parameter --name /kata/qa/db_password --value "<STRONG_PASSWORD>" --type SecureString
aws ssm put-parameter --name /kata/qa/db_database --value "kata_backend_qa" --type String

# JWT
aws ssm put-parameter --name /kata/qa/jwt_secret --value "<RANDOM_JWT_SECRET>" --type SecureString

# CORS
aws ssm put-parameter --name /kata/qa/cors_origin --value "https://qa.yourapp.com" --type String
```

### Crear Parámetros para Staging

```bash
aws ssm put-parameter --name /kata/staging/db_host --value "kata-backend-staging-db.xxxxx.us-east-1.rds.amazonaws.com" --type String
aws ssm put-parameter --name /kata/staging/db_username --value "kata_user" --type String
aws ssm put-parameter --name /kata/staging/db_password --value "<STRONG_PASSWORD>" --type SecureString
aws ssm put-parameter --name /kata/staging/db_database --value "kata_backend_staging" --type String
aws ssm put-parameter --name /kata/staging/jwt_secret --value "<RANDOM_JWT_SECRET>" --type SecureString
aws ssm put-parameter --name /kata/staging/cors_origin --value "https://staging.yourapp.com" --type String
```

### Crear Parámetros para Production

```bash
aws ssm put-parameter --name /kata/production/db_host --value "kata-backend-prod-db.xxxxx.us-east-1.rds.amazonaws.com" --type String
aws ssm put-parameter --name /kata/production/db_username --value "kata_user" --type String
aws ssm put-parameter --name /kata/production/db_password --value "<STRONG_PASSWORD>" --type SecureString
aws ssm put-parameter --name /kata/production/db_database --value "kata_backend_production" --type String
aws ssm put-parameter --name /kata/production/jwt_secret --value "<RANDOM_JWT_SECRET>" --type SecureString
aws ssm put-parameter --name /kata/production/cors_origin --value "https://yourapp.com" --type String
```

**Nota**: Generar JWT secrets seguros:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🚀 Pipeline de CI/CD

### Configuración de AWS CodePipeline

#### 1. Crear Proyecto CodeBuild para QA

```bash
aws codebuild create-project \
  --name kata-backend-qa-build \
  --source type=GITHUB,location=https://github.com/YOUR_ORG/kata_backend_project.git,buildspec=pipeline/buildspecs/buildspec.qa.yml \
  --artifacts type=NO_ARTIFACTS \
  --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL,privilegedMode=true \
  --service-role arn:aws:iam::YOUR_AWS_ACCOUNT_ID:role/codebuild-service-role
```

#### 2. Crear Pipeline para QA

```bash
# Usar la consola de AWS CodePipeline o crear con AWS CLI
# Pipeline: Source (GitHub) -> Build (CodeBuild) -> Deploy (ECS)
```

**Estructura del Pipeline:**
1. **Source Stage**: GitHub repository (rama `develop` para QA, `staging` para staging)
2. **Build Stage**: CodeBuild usando el buildspec correspondiente
3. **Deploy Stage**: ECS deployment usando la task definition generada

---

## 📦 Proceso de Deployment

### Deployment Manual (Primera Vez)

#### 1. Preparar la Imagen Docker Local
```bash
# Build local
cd kata_backend_project
npm run build

# Build Docker image
docker build -t kata-backend:latest .

# Test locally
docker run -p 3000:3000 --env-file .env.qa kata-backend:latest
```

#### 2. Push a ECR
```bash
# Login a ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag kata-backend:latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/kata-backend:qa-v1.0.0

# Push
docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/kata-backend:qa-v1.0.0
```

#### 3. Registrar Task Definition
```bash
# Actualizar task definition con la imagen correcta
sed -i "s|\${image_url}|YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/kata-backend:qa-v1.0.0|g" pipeline/service/task-definition.qa.json

# Registrar en ECS
aws ecs register-task-definition --cli-input-json file://pipeline/service/task-definition.qa.json
```

#### 4. Crear ECS Service
```bash
aws ecs create-service \
  --cluster kata-backend-qa-cluster \
  --service-name kata-backend-qa-service \
  --task-definition kata-backend-qa \
  --desired-count 1 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_ID_1>,<SUBNET_ID_2>],securityGroups=[<SG_ID>],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=<TG_ARN>,containerName=kata-backend,containerPort=3000 \
  --health-check-grace-period-seconds 60
```

### Deployment Automatizado (Subsecuentes)

Una vez configurado el pipeline:

```bash
# 1. Hacer cambios en el código
git checkout develop  # para QA
# ... hacer cambios ...

# 2. Commit y push
git add .
git commit -m "feat: nueva funcionalidad"
git push origin develop

# 3. Crear tag para deploy
./ci-cd/deploy.sh

# 4. El pipeline se ejecutará automáticamente
```

---

## 🔍 Monitoring y Logs

### Ver Logs de la Aplicación
```bash
# Via AWS CLI
aws logs tail /aws/ecs/kata-backend-qa --follow

# Via consola: CloudWatch Logs -> Log Groups -> /aws/ecs/kata-backend-qa
```

### Verificar Estado del Servicio
```bash
aws ecs describe-services --cluster kata-backend-qa-cluster --services kata-backend-qa-service
```

### Health Check
```bash
# Obtener URL del ALB
ALB_DNS=$(aws elbv2 describe-load-balancers --names kata-backend-qa-alb --query 'LoadBalancers[0].DNSName' --output text)

# Test health endpoint
curl http://$ALB_DNS/health
```

---

## 🛠️ Troubleshooting

### Problema: Task no inicia

**Síntomas**: Tasks en estado PENDING o STOPPED inmediatamente

**Soluciones**:
1. Verificar logs de CloudWatch
2. Verificar security groups (permitir tráfico saliente para ECR/SSM)
3. Verificar que execution role tiene permisos correctos
4. Verificar que los parámetros SSM existan y sean accesibles

### Problema: Health check falla

**Síntomas**: Targets en estado "unhealthy" en el Target Group

**Soluciones**:
1. Verificar que el endpoint `/health` responde correctamente
2. Verificar security groups (permitir tráfico del ALB al ECS)
3. Ajustar configuración de health check (intervalos, timeout)
4. Ver logs de la aplicación para errores

### Problema: No puede conectar a RDS

**Síntomas**: Errores de conexión a base de datos en logs

**Soluciones**:
1. Verificar security group de RDS (permitir tráfico desde ECS SG)
2. Verificar parámetros SSM (host, username, password)
3. Verificar que RDS esté en la misma VPC
4. Probar conexión manual desde un EC2 en la misma VPC

### Comandos Útiles

```bash
# Ver eventos del servicio
aws ecs describe-services --cluster kata-backend-qa-cluster --services kata-backend-qa-service --query 'services[0].events[0:10]'

# Ver tasks en ejecución
aws ecs list-tasks --cluster kata-backend-qa-cluster --service-name kata-backend-qa-service

# Describir una task específica
aws ecs describe-tasks --cluster kata-backend-qa-cluster --tasks <TASK_ARN>

# Forzar nuevo deployment
aws ecs update-service --cluster kata-backend-qa-cluster --service kata-backend-qa-service --force-new-deployment

# Ver logs de CodeBuild
aws codebuild batch-get-builds --ids <BUILD_ID>
```

---

## 📚 Referencias

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [NestJS Deployment Guide](https://docs.nestjs.com/faq/deployment)

---

## 📝 Checklist de Deployment

### Pre-Deployment
- [ ] VPC y subnets configuradas
- [ ] RDS instance creada y accesible
- [ ] ECR repository creado
- [ ] IAM roles creados con permisos correctos
- [ ] Security groups configurados
- [ ] Parámetros SSM creados
- [ ] ECS Cluster creado
- [ ] ALB y Target Group configurados
- [ ] CloudWatch Log Groups creados

### Durante Deployment
- [ ] Imagen Docker construida exitosamente
- [ ] Imagen pusheada a ECR
- [ ] Task definition registrada
- [ ] ECS Service creado/actualizado
- [ ] Health checks pasando
- [ ] Logs visibles en CloudWatch

### Post-Deployment
- [ ] Endpoint de health responde correctamente
- [ ] Aplicación accesible vía ALB
- [ ] Logs funcionando correctamente
- [ ] Métricas en CloudWatch visibles
- [ ] Tests de integración pasando
- [ ] Documentar issues encontrados

---

**Última actualización**: Diciembre 2025  
**Mantenedor**: Equipo Kata Backend
