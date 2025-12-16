#!/bin/bash

###############################################################################
# CDK Infrastructure Deployment Script
# Deploys the entire AWS infrastructure using CDK
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "\n${BLUE}===================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================${NC}\n"
}

# Check environment argument
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: Environment argument required${NC}"
    echo "Usage: ./deploy-infrastructure.sh [production|staging]"
    exit 1
fi

ENVIRONMENT=$1

if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "staging" ]; then
    echo -e "${RED}Error: Invalid environment. Must be 'production' or 'staging'${NC}"
    exit 1
fi

# Convert to title case for stack name
if [ "$ENVIRONMENT" = "production" ]; then
    STACK_NAME="KataBackendProductionStack"
else
    STACK_NAME="KataBackendStagingStack"
fi

print_step "Deploying CDK Infrastructure: ${ENVIRONMENT}"

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo -e "${RED}Error: AWS CDK CLI not found${NC}"
    echo "Install it with: npm install -g aws-cdk"
    exit 1
fi

# Navigate to infrastructure directory
cd infrastructure

# Install dependencies
print_step "Installing CDK dependencies"
npm install

# Bootstrap CDK (if not done before)
print_step "Checking CDK bootstrap"
echo -e "${YELLOW}If this is your first CDK deployment, run: cdk bootstrap${NC}"

# Synthesize CloudFormation template
print_step "Synthesizing CloudFormation template"
cdk synth ${STACK_NAME}

# Show differences
print_step "Showing infrastructure changes"
cdk diff ${STACK_NAME} || true

# Deploy
print_step "Deploying infrastructure"
cdk deploy ${STACK_NAME} --require-approval never

echo -e "\n${GREEN}✅ Infrastructure deployed successfully!${NC}"
echo -e "${GREEN}Stack: ${STACK_NAME}${NC}"
echo -e "\n${YELLOW}📝 Next steps:${NC}"
echo "1. Note the API Gateway endpoint from the outputs"
echo "2. Update your frontend API_URL configuration"
echo "3. Deploy your Lambda code with: ./deploy-lambda.sh ${ENVIRONMENT}"
echo ""
