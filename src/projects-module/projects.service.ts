import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './projects.entity';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Indicators } from '../indicators-module/indicators.entity';
import {
  ProjectWithMetricsDto,
  ProjectMetricsDto,
} from './dto/project-with-metrics.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Indicators)
    private readonly indicatorsRepository: Repository<Indicators>,
  ) {}

  // Devuelve todos los equipos con sus métricas calculadas
  async findAllWithMetrics(): Promise<ProjectWithMetricsDto[]> {
    const projects = await this.projectRepository.find();

    return Promise.all(
      projects.map(async (project) => {
        const metrics = await this.calculateProjectMetrics(project.id);
        return {
          ...project,
          metrics,
        };
      }),
    );
  }

  // Devuelve todos los equipos (sin métricas)
  async findAll(): Promise<Project[]> {
    return this.projectRepository.find();
  }

  // Calcula las métricas para un proyecto específico
  private async calculateProjectMetrics(
    projectId: string,
  ): Promise<ProjectMetricsDto> {
    // Obtener todos los indicadores del proyecto
    const indicators = await this.indicatorsRepository.find({
      where: { projectId },
      order: { runDate: 'ASC' },
    });

    if (indicators.length === 0) {
      return {
        averageSuccessRate: 0,
        currentCoverage: 0,
        testRunsCount: 0,
        averageErrorRate: 0,
        averageSecurityScore: 100,
      };
    }

    // Filtrar por tipo de pipeline
    const regressionIndicators = indicators.filter(
      (i) => i.pipelineType === 'regression',
    );
    const performanceIndicators = indicators.filter(
      (i) => i.pipelineType === 'performance',
    );
    const securityIndicators = indicators.filter(
      (i) => i.pipelineType === 'security',
    );

    // Calcular métricas de regression
    let averageSuccessRate = 0;
    let currentCoverage = 0;
    if (regressionIndicators.length > 0) {
      const totalSuccessRate = regressionIndicators.reduce(
        (sum, indicator) => sum + (indicator.executionSuccessRate ?? 0),
        0,
      );
      averageSuccessRate = totalSuccessRate / regressionIndicators.length;
      currentCoverage =
        regressionIndicators[regressionIndicators.length - 1]
          .automationCoverage ?? 0;
    }

    // Calcular métricas de performance
    let averageErrorRate = 0;
    if (performanceIndicators.length > 0) {
      let totalErrorRate = 0;
      for (const indicator of performanceIndicators) {
        if (indicator.errorRate !== null && indicator.errorRate !== undefined) {
          totalErrorRate += indicator.errorRate;
        }
      }
      averageErrorRate = totalErrorRate / performanceIndicators.length;
    }

    // Calcular métricas de security
    let averageSecurityScore = 100;
    if (securityIndicators.length > 0) {
      let totalSecurityScore = 0;
      for (const indicator of securityIndicators) {
        totalSecurityScore +=
          indicator.securityScore !== null &&
          indicator.securityScore !== undefined
            ? indicator.securityScore
            : 100;
      }
      averageSecurityScore = totalSecurityScore / securityIndicators.length;
    }

    return {
      averageSuccessRate,
      currentCoverage,
      testRunsCount: indicators.length,
      averageErrorRate,
      averageSecurityScore,
    };
  }

  // Devuelve un equipo por id (y lanza 404 si no existe)
  async findById(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    return project;
  }

  // Crea un nuevo equipo
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // Verificar si ya existe un proyecto con el mismo product y prefix
    const existingProject = await this.projectRepository.findOne({
      where: [
        { product: createProjectDto.product },
        { prefix: createProjectDto.prefix },
      ],
    });

    if (existingProject) {
      throw new ConflictException(
        `Project with product "${createProjectDto.product}" or prefix "${createProjectDto.prefix}" already exists`,
      );
    }

    const newProject = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(newProject);
  }

  // Actualiza completamente un equipo (PUT)
  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findById(id);
    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  // Actualiza parcialmente un equipo (PATCH)
  async partialUpdate(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findById(id);
    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  // Elimina un equipo por id
  async delete(id: string): Promise<void> {
    const project = await this.findById(id);

    // Verificar si existen indicadores asociados
    const indicatorsCount = await this.indicatorsRepository.count({
      where: { projectId: id },
    });

    if (indicatorsCount > 0) {
      throw new BadRequestException(
        `Cannot delete project "${project.product}". It has ${indicatorsCount} test run(s) associated. Please delete all test runs before deleting the project.`,
      );
    }

    await this.projectRepository.remove(project);
  }
}
