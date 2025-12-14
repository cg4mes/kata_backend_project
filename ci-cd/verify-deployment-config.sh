#!/bin/bash

###############################################################################
# Script para verificar configuración de deployment
# Verifica que todos los valores placeholder hayan sido reemplazados
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}===================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Contadores
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

check_placeholder() {
    local file=$1
    local placeholder=$2
    local description=$3
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ ! -f "$file" ]; then
        print_error "Archivo no encontrado: $file"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return
    fi
    
    if grep -q "$placeholder" "$file"; then
        print_error "$description en $file"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    else
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
}

check_file_exists() {
    local file=$1
    local description=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file" ]; then
        print_success "$description existe"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        print_error "$description no encontrado: $file"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

check_executable() {
    local file=$1
    local description=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -x "$file" ]; then
        print_success "$description es ejecutable"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        print_warning "$description no es ejecutable"
        WARNINGS=$((WARNINGS + 1))
        print_info "Ejecuta: chmod +x $file"
    fi
}

print_header "KATA BACKEND - VERIFICACIÓN DE DEPLOYMENT"

# 1. Verificar archivos requeridos
print_header "1. Verificando Archivos Requeridos"

check_file_exists "src/health/health.controller.ts" "Health Controller"
check_file_exists "src/health/health.module.ts" "Health Module"
check_file_exists "buildspec.yml" "BuildSpec Production"
check_file_exists "pipeline/buildspecs/buildspec.qa.yml" "BuildSpec QA"
check_file_exists "pipeline/buildspecs/buildspec.staging.yml" "BuildSpec Staging"
check_file_exists "pipeline/service/task-definition.qa.json" "Task Definition QA"
check_file_exists "pipeline/service/task-definition.staging.json" "Task Definition Staging"
check_file_exists "task-definition.json" "Task Definition Production"
check_file_exists "ci-cd/deploy.sh" "Deploy Script"
check_file_exists "ci-cd/install-dependencies.sh" "Install Script"
check_file_exists "ci-cd/local-build.sh" "Local Build Script"
check_file_exists "DEPLOYMENT.md" "Deployment Documentation"
check_file_exists "AWS_SETUP.md" "AWS Setup Guide"

# 2. Verificar placeholders
print_header "2. Verificando Placeholders de AWS Account ID"

check_placeholder "buildspec.yml" "YOUR_AWS_ACCOUNT_ID" "AWS Account ID en buildspec.yml"
check_placeholder "pipeline/buildspecs/buildspec.qa.yml" "YOUR_AWS_ACCOUNT_ID" "AWS Account ID en buildspec.qa.yml"
check_placeholder "pipeline/buildspecs/buildspec.staging.yml" "YOUR_AWS_ACCOUNT_ID" "AWS Account ID en buildspec.staging.yml"
check_placeholder "task-definition.json" "YOUR_AWS_ACCOUNT_ID" "AWS Account ID en task-definition.json"
check_placeholder "pipeline/service/task-definition.qa.json" "YOUR_AWS_ACCOUNT_ID" "AWS Account ID en task-definition.qa.json"
check_placeholder "pipeline/service/task-definition.staging.json" "YOUR_AWS_ACCOUNT_ID" "AWS Account ID en task-definition.staging.json"

# 3. Verificar permisos de scripts
print_header "3. Verificando Permisos de Scripts"

check_executable "ci-cd/deploy.sh" "deploy.sh"
check_executable "ci-cd/install-dependencies.sh" "install-dependencies.sh"
check_executable "ci-cd/local-build.sh" "local-build.sh"

# 4. Verificar Docker
print_header "4. Verificando Docker"

TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if command -v docker &> /dev/null; then
    print_success "Docker está instalado"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    docker --version
else
    print_error "Docker no está instalado"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

check_file_exists "Dockerfile" "Dockerfile"
check_file_exists ".dockerignore" ".dockerignore"

# 5. Verificar AWS CLI
print_header "5. Verificando AWS CLI"

TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if command -v aws &> /dev/null; then
    print_success "AWS CLI está instalado"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    aws --version
    
    # Verificar credenciales
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if aws sts get-caller-identity &> /dev/null; then
        print_success "AWS CLI está configurado correctamente"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
        print_info "AWS Account ID: $AWS_ACCOUNT"
    else
        print_warning "AWS CLI no está configurado (ejecuta: aws configure)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    print_error "AWS CLI no está instalado"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 6. Verificar Node.js
print_header "6. Verificando Node.js"

TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
    
    if [ "$NODE_MAJOR" -ge 20 ]; then
        print_success "Node.js versión adecuada: $NODE_VERSION"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        print_warning "Node.js versión $NODE_VERSION (se recomienda v20+)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    print_error "Node.js no está instalado"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 7. Verificar dependencias del proyecto
print_header "7. Verificando Dependencias del Proyecto"

TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if [ -d "node_modules" ]; then
    print_success "node_modules existe"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    print_warning "node_modules no existe (ejecuta: npm install)"
    WARNINGS=$((WARNINGS + 1))
fi

check_file_exists "package.json" "package.json"
check_file_exists "package-lock.json" "package-lock.json"

# 8. Verificar archivos de configuración de ambiente
print_header "8. Verificando Archivos de Ambiente"

check_file_exists ".env.qa" ".env.qa"
check_file_exists ".env.staging" ".env.staging"
check_file_exists ".env.production" ".env.production"

# Resumen
print_header "RESUMEN"

echo "Total de verificaciones: $TOTAL_CHECKS"
print_success "Pasadas: $PASSED_CHECKS"
print_warning "Advertencias: $WARNINGS"
print_error "Fallidas: $FAILED_CHECKS"

echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    print_success "✓ Todas las verificaciones críticas pasaron"
    echo ""
    print_info "Siguiente paso: Revisar y actualizar los valores en:"
    echo "  1. Todos los archivos con YOUR_AWS_ACCOUNT_ID"
    echo "  2. Archivos .env.* con valores reales"
    echo "  3. Configurar infraestructura AWS (ver AWS_SETUP.md)"
    echo ""
    exit 0
else
    print_error "✗ Hay $FAILED_CHECKS verificación(es) fallida(s)"
    echo ""
    print_info "Por favor, revisa los errores arriba y corrígelos antes de deployar"
    echo ""
    exit 1
fi
