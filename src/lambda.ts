import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import serverlessExpress from '@vendia/serverless-express';
import type {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import express from 'express';

let cachedServer: Handler<APIGatewayProxyEvent, APIGatewayProxyResult>;

/**
 * Bootstrap function for Lambda with cold start optimization
 * Caches the Express server instance to reuse across Lambda invocations
 */
async function bootstrapServer(): Promise<
  Handler<APIGatewayProxyEvent, APIGatewayProxyResult>
> {
  if (cachedServer) {
    return cachedServer;
  }

  const logger = new Logger('Lambda');
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  // Enable CORS for CloudFront and API Gateway
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:5174',
  ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);
      if (origin.includes('.cloudfront.net')) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Important: Don't call app.listen() for Lambda
  await app.init();

  // Create serverless handler
  cachedServer = serverlessExpress({ app: expressApp });

  logger.log('Lambda handler initialized successfully');

  return cachedServer;
}

/**
 * Lambda handler function
 * Entry point for AWS Lambda invocations via API Gateway
 */
export const handler: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event, context) => {
  // Enable connection reuse for better performance
  context.callbackWaitsForEmptyEventLoop = false;

  const server = await bootstrapServer();
  return server(event, context, () => {}) as Promise<APIGatewayProxyResult>;
};
