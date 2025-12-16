# CDK Infrastructure

This directory contains AWS CDK infrastructure as code for the Kata Backend project.

## Architecture

The infrastructure creates a serverless backend with:

- **Lambda Function**: NestJS application running serverless
- **API Gateway HTTP API**: RESTful API endpoint
- **Aurora Serverless v2**: PostgreSQL database (scales to 0.5 ACUs)
- **VPC**: Private networking for Lambda and database
- **Secrets Manager**: Secure storage for database credentials and JWT secrets
- **CloudWatch**: Logging and monitoring

## Cost Optimization

- **Lambda**: Pay only for execution time
- **Aurora Serverless v2**: Scales down to 0.5 ACUs when idle (~$0.06/hour)
- **NAT Gateway**: Single NAT Gateway for cost savings
- **No ALB/ECS**: Eliminates 24/7 compute costs

## Prerequisites

```bash
# Install AWS CDK CLI globally
npm install -g aws-cdk

# Configure AWS credentials
aws configure
```

## Deployment

### 1. Build the application

```bash
# From project root
cd /Users/cristhianmartinez/Documents/Kata_files/kata_backend_project
npm run build
```

### 2. Bootstrap CDK (first time only)

```bash
cd infrastructure
cdk bootstrap
```

### 3. Deploy

```bash
# Deploy to staging
cdk deploy KataBackendStagingStack

# Deploy to production
cdk deploy KataBackendProductionStack
```

### 4. Get API endpoint

```bash
# The API Gateway endpoint will be in the output
# Example: https://abc123.execute-api.us-east-1.amazonaws.com
```

## CDK Commands

```bash
# Show CloudFormation template
cdk synth

# List all stacks
cdk list

# Show differences
cdk diff

# Destroy stack
cdk destroy KataBackendStagingStack
```

## Environment Variables

The Lambda function receives:

- `NODE_ENV`: Environment name (staging/production)
- `DB_TYPE`: Database type (postgres)
- `DB_HOST`: Aurora endpoint
- `DB_PORT`: Database port (5432)
- `DB_DATABASE`: Database name
- `DB_SECRET_ARN`: ARN to database credentials secret
- `JWT_SECRET_ARN`: ARN to JWT secret
- `CORS_ORIGINS`: Allowed CORS origins

Secrets are retrieved at runtime from AWS Secrets Manager.

## Monitoring

View metrics in CloudWatch dashboard:
- Lambda invocations
- Lambda errors and duration
- API Gateway requests
- Database connections

## Estimated Costs

**Low usage (sporadic use):**
- Lambda: ~$0-5/month
- Aurora Serverless v2: ~$5-10/month
- NAT Gateway: ~$32/month
- API Gateway: ~$1-3/month
- **Total: ~$40-50/month**

**Moderate usage:**
- Lambda: ~$10-20/month
- Aurora Serverless v2: ~$15-30/month
- NAT Gateway: ~$32/month
- API Gateway: ~$5-10/month
- **Total: ~$60-90/month**

Compare to ECS: ~$80-120/month minimum (always running)

## Security

- Lambda runs in private subnets (no direct internet access)
- Database in isolated subnets (no internet access)
- Secrets stored in AWS Secrets Manager
- Security groups restrict traffic between components
- IAM roles follow least privilege principle

## Troubleshooting

### Lambda cold starts
First request after idle period takes 1-3 seconds. Solutions:
- Use provisioned concurrency (adds cost)
- Implement connection pooling
- Keep Lambda warm with CloudWatch Events

### Database connection issues
- Verify Lambda security group allows outbound to database port
- Check database security group allows inbound from Lambda SG
- Verify Lambda is in correct VPC subnets

### API Gateway 5xx errors
- Check Lambda CloudWatch logs
- Verify Lambda timeout is sufficient (30s default)
- Check database connectivity from Lambda
