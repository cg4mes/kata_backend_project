#!/bin/bash

###############################################################################
# Lambda Deployment Script
# Builds and deploys the backend to AWS Lambda
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
    echo "Usage: ./deploy-lambda.sh [production|staging|qa]"
    exit 1
fi

ENVIRONMENT=$1
FUNCTION_NAME="kata-backend-${ENVIRONMENT}"

print_step "Building Lambda Deployment Package for ${ENVIRONMENT}"

# Clean previous builds
rm -rf dist
rm -f lambda-deployment-*.zip

# Install dependencies
print_step "Installing production dependencies"
npm ci --only=production

# Build TypeScript
print_step "Building TypeScript"
npm run build

# Create deployment package
print_step "Creating deployment package"
cd dist
cp -r ../node_modules .
zip -r ../lambda-deployment-${ENVIRONMENT}.zip . -x "*.spec.js" "*.spec.d.ts" "test/*"
cd ..

# Show package size
PACKAGE_SIZE=$(du -h lambda-deployment-${ENVIRONMENT}.zip | cut -f1)
echo -e "${GREEN}Package size: ${PACKAGE_SIZE}${NC}"

# Deploy to Lambda
print_step "Deploying to AWS Lambda: ${FUNCTION_NAME}"
aws lambda update-function-code \
    --function-name "${FUNCTION_NAME}" \
    --zip-file fileb://lambda-deployment-${ENVIRONMENT}.zip \
    --region us-east-1

# Wait for update to complete
print_step "Waiting for Lambda update to complete"
aws lambda wait function-updated \
    --function-name "${FUNCTION_NAME}" \
    --region us-east-1

echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}Function: ${FUNCTION_NAME}${NC}"
echo -e "${GREEN}Package: lambda-deployment-${ENVIRONMENT}.zip${NC}\n"
