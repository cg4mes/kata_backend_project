#!/bin/bash
set -eux

# Script para instalar dependencias en CI/CD
# Soporta integración con Artifactory privado de la organización

echo "========================================="
echo "Installing Dependencies"
echo "========================================="

# Si existen credenciales de Artifactory, configurar .npmrc
if [ ! -z "${ARTIFACTORY_READER_USER:-}" ] && [ ! -z "${ARTIFACTORY_READER_API_KEY:-}" ]; then
  echo "Configuring Artifactory authentication..."
  rm ~/.npmrc 2>/dev/null || true
  echo @npm-bbta:registry=https://bbogdigital.jfrog.io/bbogdigital/api/npm/npm-bbta/ > ~/.npmrc
  curl -u "${ARTIFACTORY_READER_USER}:${ARTIFACTORY_READER_API_KEY}" \
    'https://bbogdigital.jfrog.io/bbogdigital/api/npm/auth' >> ~/.npmrc
  echo "✅ Artifactory configured"
else
  echo "⚠️  Artifactory credentials not found, using public npm registry"
fi

# Instalar dependencias
echo "Running npm ci..."
npm ci

echo "✅ Dependencies installed successfully"
