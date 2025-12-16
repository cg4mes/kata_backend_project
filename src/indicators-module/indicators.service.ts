import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LambdaIngestionDto } from './dto/indicators.dto';
import { toIndicatorDto } from './dto/indicator.dto';
import { MetricsCalculatorService } from './metrics-calculator.service';
import { ERROR_MESSAGES } from '../common/constants';
import { DynamoDBDatasource } from '../common/datasources/dynamodb.datasource';

/**
 * Service responsible for managing test run indicators across different pipeline types
 */
@Injectable()
export class IndicatorsService {
  private readonly logger = new Logger(IndicatorsService.name);

  constructor(
    private readonly dynamodb: DynamoDBDatasource,
    private readonly metricsCalculator: MetricsCalculatorService,
  ) {}

  async createFromLambda(dto: LambdaIngestionDto) {
    // 1) Buscar Project por nombre (usando GSI2 - product lookup)
    const projects = await this.dynamodb.queryGSI(
      'GSI2',
      `PRODUCT#${dto.teamName}`,
    );

    if (!projects || projects.length === 0) {
      throw new NotFoundException(`Project not found: ${dto.teamName}`);
    }

    const project = projects[0] as Record<string, any>;
    const id = uuidv4();
    const runDate = new Date(dto.timestamp);
    const timestamp = runDate.getTime(); // Unix timestamp for sorting

    // 2) Crear objeto base del indicator
    const indicatorData: Record<string, any> = {
      PK: project.PK as string, // PROJECT#{prefix}
      SK: `INDICATOR#${timestamp}#${id}`, // INDICATOR#{timestamp}#{id} para orden cronológico
      EntityType: 'Indicator',
      id,
      projectId: project.id as string,
      pipelineType: dto.pipelineType,
      runDate: runDate.toISOString(),
    };

    // 3) Procesar según tipo de pipeline
    if (dto.pipelineType === 'regression') {
      const totalTests =
        dto.totalTests ??
        (dto.passed ?? 0) + (dto.failed ?? 0) + (dto.skipped ?? 0);
      const passed = dto.passed ?? 0;
      const failed = dto.failed ?? 0;
      const skipped = dto.skipped ?? 0;

      const executionSuccessRate =
        this.metricsCalculator.calculateExecutionSuccessRate(
          passed,
          totalTests,
        );
      const automationCoverage =
        this.metricsCalculator.calculateAutomationCoverage(
          totalTests,
          project.totalDefinedTests as number,
        );

      Object.assign(indicatorData, {
        totalTests,
        passed,
        failed,
        skipped,
        executionSuccessRate,
        automationCoverage,
      });
    } else if (dto.pipelineType === 'performance') {
      const totalRequest = dto.totalRequest ?? 0;
      const okRequest = dto.okRequest ?? 0;
      const koRequest = dto.koRequest ?? 0;
      const errorRate = totalRequest > 0 ? (koRequest / totalRequest) * 100 : 0;

      Object.assign(indicatorData, {
        totalRequest,
        okRequest,
        koRequest,
        timeMean: dto.timeMean ?? 0,
        timeMax: dto.timeMax ?? 0,
        timeMin: dto.timeMin ?? 0,
        errorRate,
      });
    } else if (dto.pipelineType === 'security') {
      const high = dto.high ?? 0;
      const medium = dto.medium ?? 0;
      const low = dto.low ?? 0;
      const informational = dto.informational ?? 0;

      // Calcular score de seguridad (0-100, menos vulnerabilidades = mejor score)
      const totalVulnerabilities = high + medium + low + informational;
      const weightedScore =
        high * 10 + medium * 5 + low * 2 + informational * 1;
      const securityScore =
        totalVulnerabilities === 0 ? 100 : Math.max(0, 100 - weightedScore);

      Object.assign(indicatorData, {
        high,
        medium,
        low,
        informational,
        securityScore,
      });
    }

    // 4) Crear y guardar Indicator
    await this.dynamodb.put(indicatorData);
    return toIndicatorDto(indicatorData);
  }

  /**
   * Retrieves indicators for a specific project
   * @param projectId - Project ID
   * @returns Array of indicators (limited to 20 most recent)
   */
  async findByProject(projectId: string): Promise<any[]> {
    // Buscar el proyecto por id usando scan (igual que ProjectsService)
    const items = await this.dynamodb.scan({
      filter: 'id = :id AND EntityType = :type',
      filterValues: { ':id': projectId, ':type': 'Project' },
    });
    if (items.length === 0) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }
    const project = items[0] as Record<string, any>;

    // Query indicators by PK (PROJECT#{prefix}), SK begins with INDICATOR#
    // DynamoDB retornará ordenados por SK (timestamp) de forma descendente
    const indicators = await this.dynamodb.query(project.PK as string, {
      skBeginsWith: 'INDICATOR#',
      limit: 20,
      scanIndexForward: false, // DESC order
    });

    // Mapear a DTO limpio (sin PK, SK, EntityType, etc)
    return indicators.map(toIndicatorDto);
  }

  /**
   * Deletes a single indicator
   * @param id - Indicator ID
   * @throws NotFoundException if indicator doesn't exist
   */
  async delete(id: string): Promise<void> {
    // Buscar el indicator por ID usando scan
    const items = await this.dynamodb.scan({
      filter: 'id = :id AND EntityType = :type',
      filterValues: { ':id': id, ':type': 'Indicator' },
    });

    if (items.length === 0) {
      throw new NotFoundException(ERROR_MESSAGES.INDICATOR_NOT_FOUND);
    }

    const indicator = items[0] as Record<string, any>;
    await this.dynamodb.delete(indicator.PK as string, indicator.SK as string);
    this.logger.log(`Indicator deleted: ${id}`);
  }

  /**
   * Deletes all indicators for a specific project
   * @param projectId - Project ID
   * @returns Number of deleted indicators
   * @throws NotFoundException if project doesn't exist
   */
  async deleteAllByProject(projectId: string): Promise<number> {
    // Buscar el proyecto para validar que existe y obtener su PK
    const projects = await this.dynamodb.scan({
      filter: 'id = :id AND EntityType = :type',
      filterValues: { ':id': projectId, ':type': 'Project' },
    });

    if (projects.length === 0) {
      throw new NotFoundException(ERROR_MESSAGES.PROJECT_NOT_FOUND);
    }

    const project = projects[0] as Record<string, any>;

    // Obtener todos los indicators del proyecto
    const indicators = await this.dynamodb.query(project.PK as string, {
      skBeginsWith: 'INDICATOR#',
    });

    if (indicators.length > 0) {
      // Batch delete usando batchWrite
      const deleteRequests = indicators.map(
        (indicator: Record<string, any>) => ({
          DeleteRequest: {
            Key: { PK: indicator.PK as string, SK: indicator.SK as string },
          },
        }),
      );

      // DynamoDB permite hasta 25 items por batch
      for (let i = 0; i < deleteRequests.length; i += 25) {
        const batch = deleteRequests.slice(i, i + 25);
        await this.dynamodb.batchWrite(batch);
      }

      this.logger.log(
        `Deleted ${indicators.length} indicators for project: ${project.product as string}`,
      );
    }

    return indicators.length;
  }
}
