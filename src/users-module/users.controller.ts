import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  LoginDto,
  UserResponseDto,
  LoginResponseDto,
  UpdateUserRoleDto,
} from './dto/users.dto';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './users.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar nuevo usuario en el sistema',
    description:
      'Crea una nueva cuenta de usuario. La contraseña se almacena encriptada con bcrypt. Por defecto, los nuevos usuarios tienen rol VIEWER. Solo un usuario ADMIN puede crear otros usuarios con rol ADMIN.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Usuario registrado exitosamente. Retorna los datos del usuario (sin contraseña)',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - Ya existe un usuario con ese email o username',
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos de entrada inválidos (email incorrecto, contraseña muy corta, etc.)',
  })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión en el sistema',
    description:
      'Autentica un usuario con email y contraseña. Retorna un token JWT que debe incluirse en el header Authorization de las peticiones protegidas (formato: Bearer <token>).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Autenticación exitosa. Retorna el token JWT y los datos del usuario',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas - Email o contraseña incorrectos',
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.usersService.login(loginDto);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar todos los usuarios',
    description:
      'Retorna la lista completa de usuarios registrados en el sistema. Solo usuarios con rol ADMIN pueden acceder a este endpoint.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista de usuarios (sin contraseñas). Incluye ID, username, email, rol y fechas',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o expirado' })
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener detalles de un usuario',
    description:
      'Retorna los datos de un usuario específico por su ID. Cualquier usuario autenticado puede consultar esta información.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado exitosamente (sin contraseña)',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado con el ID proporcionado',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o expirado' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cambiar el rol de un usuario',
    description:
      'Actualiza el rol de un usuario entre ADMIN y VIEWER. Solo usuarios con rol ADMIN pueden modificar roles. Permite promover usuarios a administradores o revocar privilegios.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Rol actualizado exitosamente. Retorna los datos actualizados del usuario',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado con el ID proporcionado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o expirado' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateRole(id, updateUserRoleDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar un usuario del sistema',
    description:
      'Elimina permanentemente una cuenta de usuario. Solo usuarios con rol ADMIN pueden eliminar usuarios. No se pueden eliminar usuarios con proyectos o datos asociados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado exitosamente del sistema',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado con el ID proporcionado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o expirado' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.remove(id);
    return { message: 'Usuario eliminado exitosamente' };
  }
}
