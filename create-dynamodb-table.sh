#!/bin/bash

# Script para crear la tabla DynamoDB en DynamoDB Local
# Uso: ./create-dynamodb-table.sh

# Configuración
TABLE_NAME="kata-backend-local"
ENDPOINT="http://localhost:8000"
REGION="us-east-1"

echo "Creating DynamoDB table: $TABLE_NAME"
echo "Endpoint: $ENDPOINT"
echo "Region: $REGION"
echo ""

# Crear la tabla con GSI
aws dynamodb create-table \
    --table-name $TABLE_NAME \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
        AttributeName=GSI2PK,AttributeType=S \
        AttributeName=GSI2SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"GSI1\",
                \"KeySchema\": [
                    {\"AttributeName\":\"GSI1PK\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"GSI1SK\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {
                    \"ReadCapacityUnits\": 5,
                    \"WriteCapacityUnits\": 5
                }
            },
            {
                \"IndexName\": \"GSI2\",
                \"KeySchema\": [
                    {\"AttributeName\":\"GSI2PK\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"GSI2SK\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {
                    \"ReadCapacityUnits\": 5,
                    \"WriteCapacityUnits\": 5
                }
            }
        ]" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION \
    --endpoint-url $ENDPOINT

echo ""
echo "Table creation requested. Checking status..."
sleep 2

# Verificar que la tabla fue creada
aws dynamodb describe-table \
    --table-name $TABLE_NAME \
    --endpoint-url $ENDPOINT \
    --region $REGION \
    --query 'Table.TableStatus' \
    --output text

echo ""
echo "✅ Table created successfully!"
echo ""
echo "To list tables:"
echo "  aws dynamodb list-tables --endpoint-url $ENDPOINT --region $REGION"
echo ""
echo "To scan the table:"
echo "  aws dynamodb scan --table-name $TABLE_NAME --endpoint-url $ENDPOINT --region $REGION"
