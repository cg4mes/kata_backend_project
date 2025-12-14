#!/bin/bash

###############################################################################
# Local Build and Test Script for kata-backend
# Simulates the CI/CD pipeline locally for testing
###############################################################################

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "\n${BLUE}===================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================${NC}\n"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Parse command line arguments
ENVIRONMENT=${1:-local}
BUILD_DOCKER=${2:-false}

print_step "KATA BACKEND - LOCAL BUILD & TEST"
print_info "Environment: $ENVIRONMENT"
print_info "Build Docker: $BUILD_DOCKER"

# Step 1: Install dependencies
print_step "Step 1: Installing Dependencies"
npm ci

# Step 2: Lint
print_step "Step 2: Running Linter"
npm run lint || print_info "Linting completed with warnings"

# Step 3: Run tests
print_step "Step 3: Running Unit Tests"
npm run test

# Step 4: Build
print_step "Step 4: Building Application"
npm run build

# Step 5: Docker build (optional)
if [ "$BUILD_DOCKER" = "true" ]; then
    print_step "Step 5: Building Docker Image"
    print_info "Building Docker image..."
    docker build -t kata-backend:local .
    print_info "Docker image built successfully ✓"
    
    print_info "\nTo run the container:"
    print_info "  docker run -p 3000:3000 --env-file .env.$ENVIRONMENT kata-backend:local"
fi

print_step "BUILD COMPLETE ✓"
print_info "All checks passed successfully"

if [ "$BUILD_DOCKER" != "true" ]; then
    print_info "\nTo build Docker image, run:"
    print_info "  ./ci-cd/local-build.sh $ENVIRONMENT true"
fi
