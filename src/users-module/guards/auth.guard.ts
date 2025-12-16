import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'your-secret-key-change-in-production';
      this.logger.debug(
        `Verifying token with secret: ${secret.substring(0, 10)}...`,
      );

      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: string;
      }>(token, {
        secret,
      });

      this.logger.debug(
        `Token verified successfully for user: ${payload.email}`,
      );

      // Agregar el payload del usuario al request
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request as any)['user'] = payload;
    } catch (error) {
      this.logger.error(
        `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new UnauthorizedException('Token inválido o expirado');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
