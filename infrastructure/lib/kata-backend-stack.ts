import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface KataBackendStackProps extends cdk.StackProps {
	stage: string;
}

export class KataBackendStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: KataBackendStackProps) {
		super(scope, id, props);

		const { stage } = props;

		// ========================================
		// DynamoDB Table with Single Table Design
		// ========================================
		const table = new dynamodb.Table(this, 'KataTable', {
			tableName: `kata-backend-${stage}`,
			partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand pricing
			encryption: dynamodb.TableEncryption.AWS_MANAGED,
			pointInTimeRecovery: stage === 'production',
			removalPolicy: stage === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
			timeToLiveAttribute: 'TTL',
		});

		// GSI1: Email lookup for users
		table.addGlobalSecondaryIndex({
			indexName: 'GSI1',
			partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL,
		});

		// GSI2: Product lookup for projects
		table.addGlobalSecondaryIndex({
			indexName: 'GSI2',
			partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL,
		});

		// ========================================
		// JWT Secret
		// ========================================
		const jwtSecret = new secretsmanager.Secret(this, 'JWTSecret', {
			secretName: `/kata/${stage}/jwt-secret`,
			description: `JWT secret for ${stage} environment`,
			generateSecretString: {
				passwordLength: 64,
				excludePunctuation: true,
				includeSpace: false,
			},
		});

		// ========================================
		// Lambda Function (No VPC needed for DynamoDB)
		// ========================================
		const lambdaFunction = new lambda.Function(this, 'KataBackendLambda', {
			functionName: `kata-backend-${stage}`,
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'lambda.handler',
			code: lambda.Code.fromAsset('../dist', {
				exclude: ['node_modules', 'test', '*.spec.ts'],
			}),
			timeout: cdk.Duration.seconds(30),
			memorySize: 512, // Reduced from 1024MB for cost optimization
			environment: {
				NODE_ENV: stage,
				DYNAMODB_TABLE_NAME: table.tableName,
				AWS_REGION: this.region,
				JWT_SECRET_ARN: jwtSecret.secretArn,
				// NOSONAR: HTTP is acceptable for localhost development only
				CORS_ORIGINS:
					stage === 'production'
						? 'https://your-cloudfront-domain.cloudfront.net'
						: 'http://localhost:5173,http://localhost:5174', // NOSONAR
			},
			logRetention: logs.RetentionDays.ONE_WEEK,
			reservedConcurrentExecutions: stage === 'production' ? 10 : 2,
		});

		// Grant Lambda access to DynamoDB table
		table.grantReadWriteData(lambdaFunction);

		// Grant Lambda access to JWT secret
		jwtSecret.grantRead(lambdaFunction);

		// ========================================
		// API Gateway HTTP API
		// ========================================
		const httpApi = new apigateway.HttpApi(this, 'KataHttpApi', {
			apiName: `kata-backend-api-${stage}`,
			description: `Kata Backend API for ${stage} environment`,
			corsPreflight: {
				// NOSONAR: HTTP is acceptable for localhost development only
				allowOrigins:
					stage === 'production'
						? ['https://your-cloudfront-domain.cloudfront.net']
						: ['http://localhost:5173', 'http://localhost:5174'], // NOSONAR
				allowMethods: [
					apigateway.CorsHttpMethod.GET,
					apigateway.CorsHttpMethod.POST,
					apigateway.CorsHttpMethod.PUT,
					apigateway.CorsHttpMethod.PATCH,
					apigateway.CorsHttpMethod.DELETE,
					apigateway.CorsHttpMethod.OPTIONS,
				],
				allowHeaders: ['Content-Type', 'Authorization'],
				allowCredentials: true,
				maxAge: cdk.Duration.hours(1),
			},
		});

		// Add Lambda integration
		const lambdaIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
			'LambdaIntegration',
			lambdaFunction
		);

		httpApi.addRoutes({
			path: '/{proxy+}',
			methods: [apigateway.HttpMethod.ANY],
			integration: lambdaIntegration,
		});

		// ========================================
		// CloudWatch Dashboard (Optional)
		// ========================================
		const dashboard = new cdk.aws_cloudwatch.Dashboard(this, 'KataDashboard', {
			dashboardName: `kata-backend-${stage}`,
		});

		dashboard.addWidgets(
			new cdk.aws_cloudwatch.GraphWidget({
				title: 'Lambda Invocations',
				left: [lambdaFunction.metricInvocations()],
			}),
			new cdk.aws_cloudwatch.GraphWidget({
				title: 'Lambda Errors',
				left: [lambdaFunction.metricErrors()],
			}),
			new cdk.aws_cloudwatch.GraphWidget({
				title: 'Lambda Duration',
				left: [lambdaFunction.metricDuration()],
			}),
			new cdk.aws_cloudwatch.GraphWidget({
				title: 'API Gateway Requests',
				left: [httpApi.metricCount()],
			})
		);

		// ========================================
		// CloudFormation Outputs
		// ========================================
		const _apiEndpointOutput = new cdk.CfnOutput(this, 'ApiEndpoint', {
			value: httpApi.apiEndpoint,
			description: 'API Gateway endpoint URL',
			exportName: `kata-api-endpoint-${stage}`,
		});

		const _dynamoTableOutput = new cdk.CfnOutput(this, 'DynamoDBTableName', {
			value: table.tableName,
			description: 'DynamoDB table name',
			exportName: `kata-dynamodb-table-${stage}`,
		});

		const _lambdaArnOutput = new cdk.CfnOutput(this, 'LambdaFunctionArn', {
			value: lambdaFunction.functionArn,
			description: 'Lambda function ARN',
			exportName: `kata-lambda-arn-${stage}`,
		});

		const _lambdaNameOutput = new cdk.CfnOutput(this, 'LambdaFunctionName', {
			value: lambdaFunction.functionName,
			description: 'Lambda function name',
			exportName: `kata-lambda-name-${stage}`,
		});
	}
}
