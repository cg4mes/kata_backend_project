import {
  Body,
  Headers,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IndicatorsService } from './indicators.service';
import { LambdaIngestionDto } from './dto/indicators.dto';
import { AuthGuard } from '../users-module/guards/auth.guard';
import { RolesGuard } from '../users-module/guards/roles.guard';
import { Roles } from '../users-module/decorators/roles.decorator';
import { UserRole } from '../users-module/user-role.enum';

@ApiTags('indicators')
@Controller('indicators')
export class IndicatorsController {
  constructor(private readonly service: IndicatorsService) {}

  @Post('test-runs')
  @ApiOperation({
    summary: 'Ingerir resultados de ejecuciones de pruebas',
    description:
      'Endpoint para recibir datos de ejecuciones de pruebas (regression, security, performance) desde servicios externos como AWS Lambda o pipelines CI/CD. Requiere autenticación mediante token interno.',
  })
  @ApiHeader({
    name: 'x-internal-token',
    description:
      'Token de autenticación interno (configurado en SSM Parameter Store)',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Indicador creado exitosamente en la base de datos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación inválido o faltante',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado. Verifique que el teamName exista',
  })
  ingestTestRun(
    @Body() dto: LambdaIngestionDto,
    @Headers('x-internal-token') token: string,
  ) {
    if (token !== process.env.INTERNAL_TOKEN) {
      console.warn(
        'Unauthorized access attempt with token:',
        process.env.INTERNAL_TOKEN,
      );
      throw new UnauthorizedException('Invalid token');
    }
    return this.service.createFromLambda(dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener todas las ejecuciones de un proyecto',
    description:
      'Retorna el historial completo de ejecuciones de pruebas (regression, security, performance) para un proyecto específico.',
  })
  @ApiQuery({
    name: 'projectId',
    description:
      'ID único del proyecto del cual se desean obtener los indicadores',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de indicadores ordenados por fecha de ejecución',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o expirado' })
  findByProject(@Query('projectId') projectId: string) {
    return this.service.findByProject(projectId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar una ejecución específica',
    description:
      'Elimina permanentemente un indicador de prueba por su ID. Solo usuarios con rol ADMIN pueden realizar esta acción.',
  })
  @ApiResponse({
    status: 200,
    description: 'Indicador eliminado exitosamente de la base de datos',
  })
  @ApiResponse({
    status: 404,
    description: 'Indicador no encontrado con el ID proporcionado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o expirado' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.service.delete(id);
    return { message: 'Ejecución eliminada exitosamente' };
  }

  @Delete('project/:projectId/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar todas las ejecuciones de un proyecto',
    description:
      'Elimina permanentemente TODOS los indicadores y ejecuciones históricas de un proyecto. Útil para limpiar datos de prueba. Solo usuarios ADMIN pueden realizar esta acción.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Todas las ejecuciones del proyecto fueron eliminadas exitosamente. Retorna el número de registros eliminados.',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado con el ID proporcionado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o expirado' })
  async removeAllByProject(
    @Param('projectId') projectId: string,
  ): Promise<{ message: string; count: number }> {
    const count = await this.service.deleteAllByProject(projectId);
    return {
      message: 'Todas las ejecuciones fueron eliminadas exitosamente',
      count,
    };
  }
}
