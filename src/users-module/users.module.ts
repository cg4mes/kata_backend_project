import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production';
        const expiresIn = configService.get<string>('JWT_EXPIRATION') || '24h';
        return {
          secret,
          signOptions: { 
            expiresIn: expiresIn as any, // Hack temporal para el tipo
          },
        };
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, AuthGuard, RolesGuard],
  exports: [UsersService, AuthGuard, RolesGuard], // Exportar para usar en otros módulos
})
export class UsersModule {}
