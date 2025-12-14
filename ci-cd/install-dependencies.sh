#!/bin/bash

###############################################################################
# Installation Script for kata-backend
# Installs all dependencies for the project
###############################################################################

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_info "=== Installing kata-backend dependencies ==="

# Check Node.js version
NODE_VERSION=$(node -v)
print_info "Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm -v)
print_info "npm version: $NPM_VERSION"

# Clean install
print_info "Running clean install..."
npm ci

print_info "=== Installation complete ✓ ==="
