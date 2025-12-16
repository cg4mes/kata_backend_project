import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from './projects-module/projects.module';
import { IndicatorsModule } from './indicators-module/indicators.module';
import { UsersModule } from './users-module/users.module';
import { HealthModule } from './health/health.module';
import { DynamoDBModule } from './common/dynamodb.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DynamoDBModule, // Global DynamoDB client module
    ProjectsModule,
    IndicatorsModule,
    UsersModule,
    HealthModule,
  ],
})
export class AppModule {}
