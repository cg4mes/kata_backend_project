import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../users.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'johndoe',
    description: 'Nombre de usuario único (mínimo 3 caracteres, sin espacios)',
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    example: 'john@example.com',
    description:
      'Dirección de correo electrónico única (usado para autenticación)',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description:
      'Contraseña del usuario (mínimo 6 caracteres). Se almacenará encriptada con bcrypt',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.VIEWER,
    description:
      'Rol del usuario: ADMIN (acceso completo) o VIEWER (solo lectura). Por defecto es VIEWER',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class LoginDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Dirección de correo electrónico del usuario registrado',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Contraseña del usuario (debe coincidir con la registrada)',
  })
  @IsString()
  password: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    description:
      'Nuevo rol a asignar: ADMIN (acceso total) o VIEWER (solo lectura)',
    example: UserRole.ADMIN,
  })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  createdAt: Date;
}

export class LoginResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
