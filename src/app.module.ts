import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from './projects-module/projects.module';
import { IndicatorsModule } from './indicators-module/indicators.module';
import { UsersModule } from './users-module/users.module';
import { HealthModule } from './health/health.module';
import { Project } from './projects-module/projects.entity';
import { Indicators } from './indicators-module/indicators.entity';
import { User } from './users-module/users.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que el ConfigService esté disponible en toda la app
      envFilePath: '.env', // Lee el archivo .env
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DATABASE_TYPE', 'sqlite');

        // Configuración para PostgreSQL (Docker/Producción)
        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.get('DATABASE_HOST', 'localhost'),
            port: configService.get('DATABASE_PORT', 5432),
            username: configService.get('DATABASE_USERNAME', 'kata_user'),
            password: configService.get('DATABASE_PASSWORD', 'kata_password'),
            database: configService.get('DATABASE_NAME', 'kata_backend_dev'),
            entities: [Project, Indicators, User],
            synchronize:
              configService.get('DATABASE_SYNCHRONIZE', 'true') === 'true',
            logging: configService.get('DATABASE_LOGGING', 'false') === 'true',
          };
        }

        // Configuración para SQLite (Desarrollo local)
        return {
          type: 'sqlite',
          database: 'db.sqlite',
          entities: [Project, Indicators, User],
          synchronize: true,
        };
      },
    }),
    ProjectsModule,
    IndicatorsModule,
    UsersModule,
    HealthModule,
  ],
})
export class AppModule {}
