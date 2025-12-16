import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Bootstrap function to initialize and configure the NestJS application
 */
async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger: ['error', 'warn', 'log', 'debug', 'verbose'],
	});
	const logger = new Logger('Bootstrap');

	// Enable CORS for cross-origin requests
	// Supports CloudFront distributions and local development
	const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
		'http://localhost:5173',
		'http://localhost:5174',
	];

	app.enableCors({
		origin: (
			origin: string | undefined,
			callback: (err: Error | null, allow?: boolean) => void
		) => {
			// Allow requests with no origin (mobile apps, curl, etc.)
			if (!origin) return callback(null, true);

			// Allow CloudFront distributions (*.cloudfront.net)
			if (origin.includes('.cloudfront.net')) {
				return callback(null, true);
			}

			// Allow configured origins
			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			}

			callback(new Error('Not allowed by CORS'));
		},
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization'],
	});

	// Global validation pipe with class-validator
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // Strip properties not defined in DTO
			forbidNonWhitelisted: true, // Throw error on unknown properties
			transform: true, // Auto-transform payloads to DTO types
			transformOptions: {
				enableImplicitConversion: true,
			},
		})
	);

	// Global exception filter for consistent error responses
	app.useGlobalFilters(new HttpExceptionFilter());

	// Configuración de Swagger/OpenAPI
	const config = new DocumentBuilder()
		.setTitle('API de Gestión de Indicadores QA')
		.setDescription(
			'API RESTful para la gestión de proyectos QA, ejecuciones de pruebas y métricas de calidad. Soporta pipelines de regresión, rendimiento y seguridad con cálculos automáticos de cobertura y análisis de tendencias.'
		)
		.setVersion('1.0.0')
		.addTag('projects', 'Gestión de proyectos y productos')
		.addTag('indicators', 'Indicadores de ejecución y métricas de pruebas')
		.addTag('users', 'Gestión de usuarios y autenticación')
		.addTag('Health', 'Verificación de estado del servicio')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				description: 'Ingrese el token JWT obtenido del endpoint /users/login',
			},
			'JWT-auth'
		)
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document, {
		customSiteTitle: 'Documentación API - Indicadores QA',
		customCss: '.swagger-ui .topbar { display: none }',
	});

	const port = process.env.PORT ?? 3000;
	await app.listen(port);

	logger.log(`🚀 Application is running on: http://localhost:${port}`);
	logger.log(`📚 Swagger documentation: http://localhost:${port}/api`);
	logger.log(`🗄️  Database: DynamoDB`);
	logger.log(`🔒 JWT Authentication enabled`);
}

void bootstrap();
