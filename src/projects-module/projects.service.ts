import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  ProjectWithMetricsDto,
  ProjectMetricsDto,
} from './dto/project-with-metrics.dto';
import { DynamoDBDatasource } from '../common/datasources/dynamodb.datasource';

@Injectable()
export class ProjectsService {
  constructor(private readonly dynamodb: DynamoDBDatasource) {}

  // Devuelve todos los equipos con sus métricas calculadas
  async findAllWithMetrics(): Promise<ProjectWithMetricsDto[]> {
    const projects = await this.findAll();

    return Promise.all(
      projects.map(async (project: Record<string, any>) => {
        // Usar prefix en lugar de id para calcular métricas
        const metrics = await this.calculateProjectMetricsByPrefix(
          project.prefix as string,
        );
        return this.toProjectWithMetricsDto(project, metrics);
      }),
    );
  }

  // Mapea un proyecto de DynamoDB a ProjectWithMetricsDto (solo campos necesarios)
  private toProjectWithMetricsDto(
    project: Record<string, any>,
    metrics: ProjectMetricsDto,
  ): ProjectWithMetricsDto {
    return {
      id: project.id as string,
      product: project.product as string,
      prefix: project.prefix as string,
      totalDefinedTests: project.totalDefinedTests as number,
      createdAt: new Date(project.createdAt as string),
      updatedAt: new Date(project.updatedAt as string),
      metrics,
    };
  }

  // Devuelve todos los equipos (sin métricas)
  async findAll(): Promise<any[]> {
    // Para obtener todos los proyectos, necesitamos hacer un scan
    // ya que cada proyecto tiene un PK diferente (PROJECT#{prefix})
    // Filtramos por EntityType y que el SK sea METADATA para obtener solo los metadatos del proyecto
    const items = await this.dynamodb.scan({
      filter: 'EntityType = :type AND SK = :sk',
      filterValues: { ':type': 'Project', ':sk': 'METADATA' },
    });
    return items;
  }

  // Calcula las métricas para un proyecto específico usando su prefix
  private async calculateProjectMetricsByPrefix(
    prefix: string,
  ): Promise<ProjectMetricsDto> {
    // Obtener todos los indicadores del proyecto
    // Los indicators están guardados con PK=PROJECT#{prefix}, SK=INDICATOR#{timestamp}#{id}
    const indicators = await this.dynamodb.query(`PROJECT#${prefix}`, {
      skBeginsWith: 'INDICATOR#',
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

    // Ordenar por runDate ascendente
    indicators.sort(
      (a: Record<string, any>, b: Record<string, any>) =>
        new Date(a.runDate as string).getTime() -
        new Date(b.runDate as string).getTime(),
    );

    // Filtrar por tipo de pipeline
    const regressionIndicators = indicators.filter(
      (i: Record<string, any>) => i.pipelineType === 'regression',
    );
    const performanceIndicators = indicators.filter(
      (i: Record<string, any>) => i.pipelineType === 'performance',
    );
    const securityIndicators = indicators.filter(
      (i: Record<string, any>) => i.pipelineType === 'security',
    );

    // Calcular métricas de regression
    let averageSuccessRate = 0;
    let currentCoverage = 0;
    if (regressionIndicators.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const totalSuccessRate = regressionIndicators.reduce(
        (sum: number, indicator: Record<string, any>) =>
          sum + Number(indicator.executionSuccessRate || 0),
        0,
      );
      averageSuccessRate = totalSuccessRate / regressionIndicators.length;

      const lastIndicator = regressionIndicators[
        regressionIndicators.length - 1
      ] as Record<string, any>;

      currentCoverage = Number(lastIndicator.automationCoverage || 0);
    }

    // Calcular métricas de performance
    let averageErrorRate = 0;
    if (performanceIndicators.length > 0) {
      let totalErrorRate = 0;
      for (const indicator of performanceIndicators as Record<string, any>[]) {
        if (indicator.errorRate !== null && indicator.errorRate !== undefined) {
          totalErrorRate += Number(indicator.errorRate);
        }
      }
      averageErrorRate = totalErrorRate / performanceIndicators.length;
    }

    // Calcular métricas de security
    let averageSecurityScore = 100;
    if (securityIndicators.length > 0) {
      let totalSecurityScore = 0;
      for (const indicator of securityIndicators as Record<string, any>[]) {
        totalSecurityScore +=
          indicator.securityScore !== null &&
          indicator.securityScore !== undefined
            ? Number(indicator.securityScore)
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

  // Devuelve un equipo por id (y lanza 404 si no existe) - Solo campos públicos
  async findById(id: string): Promise<any> {
    const project = await this.findByIdInternal(id);
    return this.toProjectDto(project);
  }

  // Método interno que devuelve el objeto completo de DynamoDB (con PK, SK, etc)
  private async findByIdInternal(id: string): Promise<Record<string, any>> {
    // Scan para buscar por ID (no es la PK)
    const items = await this.dynamodb.scan({
      filter: 'id = :id AND EntityType = :type',
      filterValues: { ':id': id, ':type': 'Project' },
    });

    if (items.length === 0) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    return items[0] as Record<string, any>;
  }

  // Mapea un proyecto de DynamoDB a DTO (solo campos necesarios)
  private toProjectDto(project: Record<string, any>): Record<string, any> {
    return {
      id: project.id as string,
      product: project.product as string,
      prefix: project.prefix as string,
      totalDefinedTests: project.totalDefinedTests as number,
      createdAt: project.createdAt as string,
      updatedAt: project.updatedAt as string,
    };
  }

  // Crea un nuevo equipo
  async create(createProjectDto: CreateProjectDto): Promise<any> {
    // Verificar si ya existe proyecto con el mismo prefix (PK)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const existingByPrefix = await this.dynamodb.get(
      `PROJECT#${createProjectDto.prefix}`,
      'METADATA',
    );
    if (existingByPrefix) {
      throw new ConflictException(
        `Project with prefix "${createProjectDto.prefix}" already exists`,
      );
    }

    // Verificar si ya existe proyecto con el mismo product (GSI2)
    const existingByProduct = await this.dynamodb.queryGSI(
      'GSI2',
      `PRODUCT#${createProjectDto.product}`,
    );
    if (existingByProduct && existingByProduct.length > 0) {
      throw new ConflictException(
        `Project with product "${createProjectDto.product}" already exists`,
      );
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const projectItem = {
      PK: `PROJECT#${createProjectDto.prefix}`,
      SK: 'METADATA',
      EntityType: 'Project',
      id,
      prefix: createProjectDto.prefix,
      product: createProjectDto.product,
      totalDefinedTests: createProjectDto.totalDefinedTests,
      createdAt: now,
      updatedAt: now,
      // GSI2 for product lookup
      GSI2PK: `PRODUCT#${createProjectDto.product}`,
      GSI2SK: `PROJECT#${createProjectDto.prefix}`,
    };

    await this.dynamodb.put(projectItem);
    return this.toProjectDto(projectItem);
  }

  // Actualiza completamente un equipo (PUT/PATCH)
  // Solo permite actualizar totalDefinedTests
  // product y prefix no se pueden cambiar porque son llaves (PK y GSI2)
  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<any> {
    const project = await this.findByIdInternal(id);

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (updateProjectDto.totalDefinedTests !== undefined) {
      updates.totalDefinedTests = updateProjectDto.totalDefinedTests;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const updatedProject = await this.dynamodb.update(
      project.PK as string,
      project.SK as string,
      updates,
      true,
    );

    return this.toProjectDto(updatedProject as Record<string, any>);
  }

  // Actualiza parcialmente un equipo (PATCH)
  async partialUpdate(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<any> {
    return this.update(id, updateProjectDto);
  }

  // Elimina un equipo por id
  async delete(id: string): Promise<void> {
    const project = await this.findByIdInternal(id);

    // Verificar si existen indicadores asociados
    // Los indicators tienen PK=PROJECT#{prefix}, SK=INDICATOR#...
    const indicators = await this.dynamodb.query(project.PK as string, {
      skBeginsWith: 'INDICATOR#',
      limit: 1,
    });

    if (indicators.length > 0) {
      // Contar todos los indicators para el mensaje
      const allIndicators = await this.dynamodb.query(project.PK as string, {
        skBeginsWith: 'INDICATOR#',
      });

      throw new BadRequestException(
        `Cannot delete project "${project.product as string}". It has ${allIndicators.length} test run(s) associated. Please delete all test runs before deleting the project.`,
      );
    }

    await this.dynamodb.delete(project.PK as string, project.SK as string);
  }
}
