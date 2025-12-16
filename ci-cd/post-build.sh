#!/bin/bash
set -e

# Script para limpieza post-build

echo "========================================="
echo "Post-Build Cleanup"
echo "========================================="

# Información del build
if [ -d "dist" ]; then
  echo "Build size: $(du -sh dist | cut -f1)"
  echo "Build files count: $(find dist -type f | wc -l)"
fi

# Opcional: Limpiar archivos temporales
echo "Cleaning temporary files..."
rm -rf .scannerwork || true

echo "Post-build cleanup completed"
