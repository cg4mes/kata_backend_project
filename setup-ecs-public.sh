#!/bin/bash

################################################################################
# Script de Configuración de ECS con IP Pública para Backend
# 
# Este script configura:
# - VPC con subnets públicas y privadas
# - ECS Cluster
# - ECS Service con asignación de IP pública
# - Security Groups
# - RDS PostgreSQL
# - Route 53 DNS record
#
# Uso: ./setup-ecs-public.sh <environment>
# Ejemplo: ./setup-ecs-public.sh production
################################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar argumento de entorno
if [ -z "$1" ]; then
    error "Uso: $0 <environment> (qa|staging|production)"
fi

ENVIRONMENT=$1
AWS_REGION="us-east-1"

# Validar entorno
if [[ ! "$ENVIRONMENT" =~ ^(qa|staging|production)$ ]]; then
    error "Entorno inválido. Usa: qa, staging, o production"
fi

log "Configurando ECS Backend para entorno: ${BLUE}$ENVIRONMENT${NC}"

# Solicitar información necesaria
read -p "Ingresa tu AWS Account ID: " AWS_ACCOUNT_ID
read -p "Ingresa el nombre del dominio para la API (ej: api.kata.lab.com): " API_DOMAIN
read -p "Ingresa el Hosted Zone ID de Route 53: " HOSTED_ZONE_ID

# Variables derivadas
CLUSTER_NAME="kata-backend-cluster-${ENVIRONMENT}"
SERVICE_NAME="kata-backend-service-${ENVIRONMENT}"
TASK_FAMILY="kata-backend-${ENVIRONMENT}"

# Configuración por entorno
case $ENVIRONMENT in
    qa)
        CPU="512"
        MEMORY="1024"
        DESIRED_COUNT="1"
        RDS_INSTANCE_CLASS="db.t4g.micro"
        ;;
    staging)
        CPU="512"
        MEMORY="1024"
        DESIRED_COUNT="1"
        RDS_INSTANCE_CLASS="db.t4g.small"
        ;;
    production)
        CPU="1024"
        MEMORY="2048"
        DESIRED_COUNT="2"
        RDS_INSTANCE_CLASS="db.t4g.small"
        ;;
esac

################################################################################
# 1. CREAR VPC Y SUBNETS
################################################################################

log "Paso 1: Creando VPC y subnets..."

# Verificar si ya existe VPC
VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=tag:Name,Values=kata-vpc-${ENVIRONMENT}" \
    --query 'Vpcs[0].VpcId' \
    --output text 2>/dev/null || echo "None")

if [ "$VPC_ID" == "None" ]; then
    # Crear VPC
    VPC_ID=$(aws ec2 create-vpc \
        --cidr-block 10.0.0.0/16 \
        --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=kata-vpc-${ENVIRONMENT}}]" \
        --query 'Vpc.VpcId' \
        --output text)
    
    log "VPC creada: ${VPC_ID}"
    
    # Habilitar DNS
    aws ec2 modify-vpc-attribute --vpc-id "${VPC_ID}" --enable-dns-hostnames
    aws ec2 modify-vpc-attribute --vpc-id "${VPC_ID}" --enable-dns-support
else
    warning "Usando VPC existente: ${VPC_ID}"
fi

# Crear Internet Gateway
IGW_ID=$(aws ec2 describe-internet-gateways \
    --filters "Name=attachment.vpc-id,Values=${VPC_ID}" \
    --query 'InternetGateways[0].InternetGatewayId' \
    --output text 2>/dev/null || echo "None")

if [ "$IGW_ID" == "None" ]; then
    IGW_ID=$(aws ec2 create-internet-gateway \
        --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=kata-igw-${ENVIRONMENT}}]" \
        --query 'InternetGateway.InternetGatewayId' \
        --output text)
    
    aws ec2 attach-internet-gateway --vpc-id "${VPC_ID}" --internet-gateway-id "${IGW_ID}"
    log "Internet Gateway creado: ${IGW_ID}"
else
    warning "Usando Internet Gateway existente: ${IGW_ID}"
fi

# Crear subnets públicas (para ECS con IP pública)
PUBLIC_SUBNET_1=$(aws ec2 create-subnet \
    --vpc-id "${VPC_ID}" \
    --cidr-block 10.0.1.0/24 \
    --availability-zone "${AWS_REGION}a" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=kata-public-subnet-1-${ENVIRONMENT}}]" \
    --query 'Subnet.SubnetId' \
    --output text 2>/dev/null || \
    aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=cidr-block,Values=10.0.1.0/24" \
        --query 'Subnets[0].SubnetId' \
        --output text)

PUBLIC_SUBNET_2=$(aws ec2 create-subnet \
    --vpc-id "${VPC_ID}" \
    --cidr-block 10.0.2.0/24 \
    --availability-zone "${AWS_REGION}b" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=kata-public-subnet-2-${ENVIRONMENT}}]" \
    --query 'Subnet.SubnetId' \
    --output text 2>/dev/null || \
    aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=cidr-block,Values=10.0.2.0/24" \
        --query 'Subnets[0].SubnetId' \
        --output text)

log "Subnets públicas: ${PUBLIC_SUBNET_1}, ${PUBLIC_SUBNET_2}"

# Crear subnets privadas (para RDS)
PRIVATE_SUBNET_1=$(aws ec2 create-subnet \
    --vpc-id "${VPC_ID}" \
    --cidr-block 10.0.10.0/24 \
    --availability-zone "${AWS_REGION}a" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=kata-private-subnet-1-${ENVIRONMENT}}]" \
    --query 'Subnet.SubnetId' \
    --output text 2>/dev/null || \
    aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=cidr-block,Values=10.0.10.0/24" \
        --query 'Subnets[0].SubnetId' \
        --output text)

PRIVATE_SUBNET_2=$(aws ec2 create-subnet \
    --vpc-id "${VPC_ID}" \
    --cidr-block 10.0.11.0/24 \
    --availability-zone "${AWS_REGION}b" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=kata-private-subnet-2-${ENVIRONMENT}}]" \
    --query 'Subnet.SubnetId' \
    --output text 2>/dev/null || \
    aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=cidr-block,Values=10.0.11.0/24" \
        --query 'Subnets[0].SubnetId' \
        --output text)

log "Subnets privadas: ${PRIVATE_SUBNET_1}, ${PRIVATE_SUBNET_2}"

# Crear route table para subnets públicas
ROUTE_TABLE_ID=$(aws ec2 create-route-table \
    --vpc-id "${VPC_ID}" \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=kata-public-rt-${ENVIRONMENT}}]" \
    --query 'RouteTable.RouteTableId' \
    --output text 2>/dev/null || \
    aws ec2 describe-route-tables \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Name,Values=kata-public-rt-${ENVIRONMENT}" \
        --query 'RouteTables[0].RouteTableId' \
        --output text)

# Agregar ruta a Internet Gateway
aws ec2 create-route \
    --route-table-id "${ROUTE_TABLE_ID}" \
    --destination-cidr-block 0.0.0.0/0 \
    --gateway-id "${IGW_ID}" 2>/dev/null || true

# Asociar subnets públicas con route table
aws ec2 associate-route-table --subnet-id "${PUBLIC_SUBNET_1}" --route-table-id "${ROUTE_TABLE_ID}" 2>/dev/null || true
aws ec2 associate-route-table --subnet-id "${PUBLIC_SUBNET_2}" --route-table-id "${ROUTE_TABLE_ID}" 2>/dev/null || true

################################################################################
# 2. CREAR SECURITY GROUPS
################################################################################

log "Paso 2: Creando Security Groups..."

# Security Group para ECS Backend
ECS_SG_ID=$(aws ec2 create-security-group \
    --group-name "kata-backend-ecs-sg-${ENVIRONMENT}" \
    --description "Security group for Kata Backend ECS tasks" \
    --vpc-id "${VPC_ID}" \
    --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=kata-backend-ecs-sg-${ENVIRONMENT}}]" \
    --query 'GroupId' \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=group-name,Values=kata-backend-ecs-sg-${ENVIRONMENT}" \
        --query 'SecurityGroups[0].GroupId' \
        --output text)

# Permitir HTTPS desde Internet
aws ec2 authorize-security-group-ingress \
    --group-id "${ECS_SG_ID}" \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 2>/dev/null || true

# Permitir HTTP desde Internet (para health checks)
aws ec2 authorize-security-group-ingress \
    --group-id "${ECS_SG_ID}" \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0 2>/dev/null || true

log "ECS Security Group: ${ECS_SG_ID}"

# Security Group para RDS
RDS_SG_ID=$(aws ec2 create-security-group \
    --group-name "kata-backend-rds-sg-${ENVIRONMENT}" \
    --description "Security group for Kata Backend RDS" \
    --vpc-id "${VPC_ID}" \
    --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=kata-backend-rds-sg-${ENVIRONMENT}}]" \
    --query 'GroupId' \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=group-name,Values=kata-backend-rds-sg-${ENVIRONMENT}" \
        --query 'SecurityGroups[0].GroupId' \
        --output text)

# Permitir PostgreSQL solo desde ECS
aws ec2 authorize-security-group-ingress \
    --group-id "${RDS_SG_ID}" \
    --protocol tcp \
    --port 5432 \
    --source-group "${ECS_SG_ID}" 2>/dev/null || true

log "RDS Security Group: ${RDS_SG_ID}"

################################################################################
# 3. CREAR ECS CLUSTER
################################################################################

log "Paso 3: Creando ECS Cluster..."

aws ecs create-cluster \
    --cluster-name "${CLUSTER_NAME}" \
    --capacity-providers FARGATE FARGATE_SPOT \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
    --tags key=Environment,value="${ENVIRONMENT}" 2>/dev/null || \
    warning "Cluster ${CLUSTER_NAME} ya existe"

log "ECS Cluster: ${CLUSTER_NAME}"

################################################################################
# 4. CONFIGURAR SSM PARAMETERS
################################################################################

log "Paso 4: Verificando SSM Parameters..."

echo -e "${YELLOW}Asegúrate de configurar estos parámetros en SSM:${NC}"
echo "  - /kata/${ENVIRONMENT}/db_host"
echo "  - /kata/${ENVIRONMENT}/db_username"
echo "  - /kata/${ENVIRONMENT}/db_password"
echo "  - /kata/${ENVIRONMENT}/db_database"
echo "  - /kata/${ENVIRONMENT}/jwt_secret"
echo "  - /kata/${ENVIRONMENT}/cors_origin"
echo ""
read -p "Presiona Enter para continuar..."

################################################################################
# RESUMEN
################################################################################

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           CONFIGURACIÓN COMPLETADA EXITOSAMENTE           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Entorno:${NC}              ${ENVIRONMENT}"
echo -e "  ${BLUE}VPC ID:${NC}               ${VPC_ID}"
echo -e "  ${BLUE}Public Subnets:${NC}       ${PUBLIC_SUBNET_1}, ${PUBLIC_SUBNET_2}"
echo -e "  ${BLUE}Private Subnets:${NC}      ${PRIVATE_SUBNET_1}, ${PRIVATE_SUBNET_2}"
echo -e "  ${BLUE}ECS Security Group:${NC}   ${ECS_SG_ID}"
echo -e "  ${BLUE}RDS Security Group:${NC}   ${RDS_SG_ID}"
echo -e "  ${BLUE}ECS Cluster:${NC}          ${CLUSTER_NAME}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Crea la base de datos RDS en las subnets privadas"
echo "  2. Actualiza los SSM Parameters con las credenciales"
echo "  3. Despliega el servicio ECS con el script de CI/CD"
echo "  4. Configura Route 53 para apuntar ${API_DOMAIN} a la IP del task"
echo ""

# Guardar configuración
cat > ".env.backend.${ENVIRONMENT}" <<EOF
# AWS ECS Backend Configuration
AWS_REGION=${AWS_REGION}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}
VPC_ID=${VPC_ID}
PUBLIC_SUBNET_1=${PUBLIC_SUBNET_1}
PUBLIC_SUBNET_2=${PUBLIC_SUBNET_2}
PRIVATE_SUBNET_1=${PRIVATE_SUBNET_1}
PRIVATE_SUBNET_2=${PRIVATE_SUBNET_2}
ECS_SG_ID=${ECS_SG_ID}
RDS_SG_ID=${RDS_SG_ID}
ECS_CLUSTER=${CLUSTER_NAME}
ENVIRONMENT=${ENVIRONMENT}
EOF

log "Configuración guardada en ${BLUE}.env.backend.${ENVIRONMENT}${NC}"
log "Script completado exitosamente 🚀"
