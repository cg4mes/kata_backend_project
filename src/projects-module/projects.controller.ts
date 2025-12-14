import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { Project } from './projects.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateManyProjectsDto } from './dto/create-many-projects.dto';
import { ProjectWithMetricsDto } from './dto/project-with-metrics.dto';
import { AuthGuard } from '../users-module/guards/auth.guard';
import { RolesGuard } from '../users-module/guards/roles.guard';
import { Roles } from '../users-module/decorators/roles.decorator';
import { UserRole } from '../users-module/users.entity';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los proyectos con métricas calculadas',
    description:
      'Retorna la lista completa de proyectos con métricas agregadas: tasas de éxito promedio, cobertura de código, duración promedio de ejecuciones, vulnerabilidades, y tiempos de respuesta para cada pipeline (regression, security, performance).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista de proyectos con métricas calculadas automáticamente desde los indicadores históricos',
    type: [ProjectWithMetricsDto],
  })
  findAll(): Promise<ProjectWithMetricsDto[]> {
    return this.projectsService.findAllWithMetrics();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalles de un proyecto',
    description:
      'Retorna la información básica de un proyecto específico (sin métricas calculadas). Para obtener métricas use el endpoint GET /projects.',
  })
  @ApiResponse({ status: 200, description: 'Proyecto encontrado exitosamente' })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado con el ID proporcionado',
  })
  findOne(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear un nuevo proyecto',
    description:
      'Crea un nuevo proyecto/producto en el sistema. Cada proyecto puede tener múltiples ejecuciones de pruebas asociadas. Solo usuarios ADMIN pueden crear proyectos.',
  })
  @ApiResponse({
    status: 201,
    description: 'Proyecto creado exitosamente en la base de datos',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflicto - Ya existe un proyecto con el mismo nombre (product) o prefijo (prefix)',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o incompletos',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o expirado' })
  create(@Body() createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(createProjectDto);
  }

  @Post('bulk')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear múltiples proyectos simultáneamente',
    description:
      'Permite crear varios proyectos en una sola operación. Útil para inicialización masiva o migración de datos. Solo usuarios ADMIN pueden realizar esta operación.',
  })
  @ApiResponse({
    status: 201,
    description: 'Todos los proyectos fueron creados exitosamente',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflicto - Algunos proyectos ya existen o hay duplicados en la petición (product o prefix)',
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos de entrada inválidos o incompletos en uno o más proyectos',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o expirado' })
  createMany(
    @Body() createManyProjectsDto: CreateManyProjectsDto,
  ): Promise<Project[]> {
    return this.projectsService.createMany(createManyProjectsDto.teams);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar completamente un proyecto',
    description:
      'Reemplaza TODOS los campos del proyecto. Se deben enviar todos los campos obligatorios. Para actualizaciones parciales use PATCH. Solo usuarios ADMIN pueden actualizar proyectos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Proyecto actualizado exitosamente con los nuevos valores',
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
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar parcialmente un proyecto',
    description:
      'Actualiza solo los campos especificados del proyecto. Los campos no enviados mantendrán su valor actual. Solo usuarios ADMIN pueden actualizar proyectos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Proyecto actualizado exitosamente con los campos modificados',
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
  partialUpdate(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.partialUpdate(id, updateProjectDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar un proyecto',
    description:
      'Elimina permanentemente un proyecto. ADVERTENCIA: Esto también eliminará todos los indicadores y ejecuciones asociadas al proyecto. Solo usuarios ADMIN pueden eliminar proyectos.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Proyecto eliminado exitosamente junto con todas sus ejecuciones',
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
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.projectsService.delete(id);
    return { message: 'Proyecto eliminado exitosamente' };
  }
}
