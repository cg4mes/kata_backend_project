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
  @ApiOperation({ summary: 'Obtener todos los proyectos con métricas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de proyectos con métricas calculadas',
    type: [ProjectWithMetricsDto],
  })
  findAll(): Promise<ProjectWithMetricsDto[]> {
    return this.projectsService.findAllWithMetrics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proyecto por ID' })
  @ApiResponse({ status: 200, description: 'Proyecto encontrado' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  findOne(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo proyecto (solo admin)' })
  @ApiResponse({ status: 201, description: 'Proyecto creado exitosamente' })
  @ApiResponse({
    status: 409,
    description: 'El proyecto ya existe (product o prefix duplicado)',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'No tienes permisos (solo admin)' })
  create(@Body() createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(createProjectDto);
  }

  @Post('bulk')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear múltiples proyectos a la vez (solo admin)' })
  @ApiResponse({ status: 201, description: 'Proyectos creados exitosamente' })
  @ApiResponse({
    status: 409,
    description: 'Algunos proyectos ya existen o hay duplicados en la petición',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'No tienes permisos (solo admin)' })
  createMany(
    @Body() createManyProjectsDto: CreateManyProjectsDto,
  ): Promise<Project[]> {
    return this.projectsService.createMany(createManyProjectsDto.teams);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar completamente un proyecto (solo admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Proyecto actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos (solo admin)' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar parcialmente un proyecto (solo admin)' })
  @ApiResponse({
    status: 200,
    description: 'Proyecto actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos (solo admin)' })
  partialUpdate(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.partialUpdate(id, updateProjectDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un proyecto (solo admin)' })
  @ApiResponse({ status: 200, description: 'Proyecto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos (solo admin)' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.projectsService.delete(id);
    return { message: 'Project deleted successfully' };
  }
}
