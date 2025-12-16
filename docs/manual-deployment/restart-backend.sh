#!/bin/bash

# Script para reiniciar el backend completamente

echo "🛑 Deteniendo procesos existentes..."
pkill -9 -f "nest start" 2>/dev/null
pkill -9 -f "npm run start:dev" 2>/dev/null
pkill -9 -f "node.*kata_backend" 2>/dev/null
sleep 2

echo "✅ Procesos detenidos"
echo ""

# Verificar que el puerto esté libre
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Puerto 3000 todavía está ocupado, intentando liberar..."
    kill -9 $(lsof -t -i:3000) 2>/dev/null
    sleep 2
fi

echo "🚀 Iniciando backend..."
cd "$(dirname "$0")"
npm run start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "Backend iniciado con PID: $BACKEND_PID"
echo "Esperando a que el servidor esté listo..."

# Esperar a que el servidor responda
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Backend está listo!"
        echo ""
        echo "📊 Health check:"
        curl -s http://localhost:3000/health | jq
        echo ""
        echo "📝 Logs: tail -f /tmp/backend.log"
        exit 0
    fi
    echo "Esperando... ($i/30)"
    sleep 1
done

echo "❌ El backend no respondió a tiempo"
echo "Ver logs: tail -f /tmp/backend.log"
exit 1
