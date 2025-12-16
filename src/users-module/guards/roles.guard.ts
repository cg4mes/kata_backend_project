import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles) {
			return true;
		}

		const request = context.switchToHttp().getRequest<{ user?: { role: UserRole } }>();
		const { user } = request;

		if (!user) {
			throw new ForbiddenException('Usuario no autenticado');
		}

		const hasRole = requiredRoles.some((role) => user.role === role);

		if (!hasRole) {
			throw new ForbiddenException('No tienes permisos para realizar esta acción');
		}

		return true;
	}
}
