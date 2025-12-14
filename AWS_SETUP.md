# AWS Configuration Quick Reference

## 📋 Valores que debes reemplazar

### En todos los archivos de configuración

Busca y reemplaza los siguientes valores:

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `YOUR_AWS_ACCOUNT_ID` | Tu AWS Account ID | `123456789012` |
| `<VPC_ID>` | ID de tu VPC | `vpc-0123456789abcdef0` |
| `<SUBNET_ID_1>` | ID de subnet 1 | `subnet-0123456789abcdef0` |
| `<SUBNET_ID_2>` | ID de subnet 2 | `subnet-0123456789abcdef1` |
| `<SG_ID>` | Security Group ID para ECS | `sg-0123456789abcdef0` |
| `<RDS_SG_ID>` | Security Group ID para RDS | `sg-0123456789abcdef1` |
| `<ALB_ARN>` | ARN del Application Load Balancer | `arn:aws:elasticloadbalancing:...` |
| `<TG_ARN>` | ARN del Target Group | `arn:aws:elasticloadbalancing:...` |

### Archivos a actualizar:

1. **buildspec.yml** (línea 5)
2. **pipeline/buildspecs/buildspec.qa.yml** (línea 5)
3. **pipeline/buildspecs/buildspec.staging.yml** (línea 5)
4. **task-definition.json** (líneas 7-8)
5. **pipeline/service/task-definition.qa.json** (líneas 7-8, y todos los ARN de SSM)
6. **pipeline/service/task-definition.staging.json** (líneas 7-8, y todos los ARN de SSM)

## 🔧 Configuración rápida por ambiente

### QA Environment

```bash
# 1. Crear VPC y networking
export ENV=qa
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# 2. Crear ECR (una sola vez, compartido entre ambientes)
aws ecr create-repository --repository-name kata-backend

# 3. Crear RDS
aws rds create-db-instance \
  --db-instance-identifier kata-backend-$ENV-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username kata_admin \
  --master-user-password CHANGE_ME_STRONG_PASSWORD \
  --allocated-storage 20

# 4. Crear parámetros SSM
aws ssm put-parameter --name /kata/$ENV/db_host --value "kata-backend-$ENV-db.xxxxx.rds.amazonaws.com" --type String
aws ssm put-parameter --name /kata/$ENV/db_username --value "kata_user" --type String
aws ssm put-parameter --name /kata/$ENV/db_password --value "CHANGE_ME" --type SecureString
aws ssm put-parameter --name /kata/$ENV/db_database --value "kata_backend_$ENV" --type String
aws ssm put-parameter --name /kata/$ENV/jwt_secret --value "$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" --type SecureString
aws ssm put-parameter --name /kata/$ENV/cors_origin --value "https://$ENV.yourapp.com" --type String

# 5. Crear ECS Cluster
aws ecs create-cluster --cluster-name kata-backend-$ENV-cluster

# 6. Crear Log Group
aws logs create-log-group --log-group-name /aws/ecs/kata-backend-$ENV
```

### Staging Environment

Repetir los mismos pasos cambiando `ENV=staging`

### Production Environment

Repetir los mismos pasos cambiando `ENV=production` y ajustando recursos (instancias más grandes, multi-AZ, etc.)

## 🚀 Primer Deployment

```bash
# 1. Actualizar AWS_ACCOUNT_ID en archivos de configuración
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Tu AWS Account ID es: $AWS_ACCOUNT_ID"

# Actualiza manualmente en los archivos o usa sed:
find . -type f \( -name "*.yml" -o -name "*.json" \) -exec sed -i '' "s/YOUR_AWS_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" {} +

# 2. Build y push primera imagen
cd kata_backend_project
docker build -t kata-backend:qa-v1.0.0 .

# 3. Push a ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker tag kata-backend:qa-v1.0.0 $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/kata-backend:qa-v1.0.0
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/kata-backend:qa-v1.0.0

# 4. Registrar task definition
sed "s|\${image_url}|$AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/kata-backend:qa-v1.0.0|g" pipeline/service/task-definition.qa.json > /tmp/task-def-qa.json
aws ecs register-task-definition --cli-input-json file:///tmp/task-def-qa.json

# 5. Crear servicio ECS (requiere VPC, subnets, security groups configurados)
aws ecs create-service \
  --cluster kata-backend-qa-cluster \
  --service-name kata-backend-qa-service \
  --task-definition kata-backend-qa \
  --desired-count 1 \
  --launch-type FARGATE
```

## ✅ Verificación

```bash
# Verificar servicio
aws ecs describe-services --cluster kata-backend-qa-cluster --services kata-backend-qa-service

# Ver logs
aws logs tail /aws/ecs/kata-backend-qa --follow

# Test health endpoint (obtener IP pública de la task)
TASK_ARN=$(aws ecs list-tasks --cluster kata-backend-qa-cluster --service-name kata-backend-qa-service --query 'taskArns[0]' --output text)
ENI_ID=$(aws ecs describe-tasks --cluster kata-backend-qa-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

curl http://$PUBLIC_IP:3000/health
```

## 📊 Recursos por Ambiente

| Recurso | QA | Staging | Production |
|---------|-----|---------|------------|
| ECS CPU | 512 | 512 | 1024 |
| ECS Memory | 1024 MB | 1024 MB | 2048 MB |
| RDS Instance | db.t3.micro | db.t3.small | db.t3.medium |
| RDS Multi-AZ | No | No | Sí |
| Desired Count | 1 | 2 | 3+ |
| Auto-scaling | No | Opcional | Sí |

## 🔐 Security Checklist

- [ ] Security Groups configurados (permitir solo tráfico necesario)
- [ ] RDS no es publicly accessible
- [ ] Secrets en SSM Parameter Store (no hardcoded)
- [ ] IAM roles siguiendo principio de mínimo privilegio
- [ ] VPC con subnets públicas y privadas separadas
- [ ] Logs habilitados en CloudWatch
- [ ] Encryption at rest habilitado (RDS, ECR)
- [ ] SSL/TLS en ALB configurado
- [ ] CloudWatch Alarms configuradas

## 💰 Estimación de Costos (Mensual)

### QA Environment
- ECS Fargate (512 CPU, 1GB RAM, 1 task): ~$15
- RDS db.t3.micro: ~$15
- ALB: ~$20
- Data Transfer: ~$5
- **Total estimado: ~$55/mes**

### Staging Environment
- ECS Fargate (512 CPU, 1GB RAM, 2 tasks): ~$30
- RDS db.t3.small: ~$30
- ALB: ~$20
- Data Transfer: ~$10
- **Total estimado: ~$90/mes**

### Production Environment
- ECS Fargate (1024 CPU, 2GB RAM, 3 tasks): ~$90
- RDS db.t3.medium Multi-AZ: ~$120
- ALB: ~$20
- Data Transfer: ~$20
- **Total estimado: ~$250/mes**

*Nota: Precios aproximados para región us-east-1. Pueden variar según uso real.*
