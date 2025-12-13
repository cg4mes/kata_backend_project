import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from './projects-module/projects.module';
import { IndicatorsModule } from './indicators-module/indicators.module';
import { UsersModule } from './users-module/users.module';
import { Project } from './projects-module/projects.entity';
import { Indicators } from './indicators-module/indicators.entity';
import { User } from './users-module/users.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que el ConfigService esté disponible en toda la app
      envFilePath: '.env', // Lee el archivo .env
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [Project, Indicators, User],
      synchronize: true,
    }),
    ProjectsModule,
    IndicatorsModule,
    UsersModule,
  ],
})
export class AppModule {}
