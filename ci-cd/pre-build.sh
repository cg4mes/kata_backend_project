#!/bin/bash
set -e

# Script para validaciones pre-build

echo "========================================="
echo "Pre-Build Validations"
echo "========================================="

# Validar versiones
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Validar que existe package.json
if [ ! -f "package.json" ]; then
  echo "❌ ERROR: package.json not found"
  exit 1
fi

# Validar que existe tsconfig.json
if [ ! -f "tsconfig.json" ]; then
  echo "❌ ERROR: tsconfig.json not found"
  exit 1
fi

echo "✅ Pre-build validations passed"
