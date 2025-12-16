#!/bin/bash
set -e

# Script para instalar dependencias en CI/CD
# Estándar Banco de Bogotá

echo "========================================="
echo "Installing Dependencies"
echo "========================================="

# Instalar dependencias de producción
echo "Running npm ci..."
npm ci

echo "Dependencies installed successfully"
