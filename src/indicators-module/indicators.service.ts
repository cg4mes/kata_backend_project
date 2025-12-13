import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Indicators } from './indicators.entity';
import { Project } from 'src/projects-module/projects.entity';
import { Repository } from 'typeorm';
import { LambdaIngestionDto } from './dto/indicators.dto';
import { MetricsCalculatorService } from './metrics-calculator.service';
import { ERROR_MESSAGES } from '../common/constants';

/**
 * Service responsible for managing test run indicators across different pipeline types
 */
@Injectable()
export class IndicatorsService {
  private readonly logger = new Logger(IndicatorsService.name);

  constructor(
    @InjectRepository(Indicators) private readonly repo: Repository<Indicators>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly metricsCalculator: MetricsCalculatorService,
  ) {}

  async createFromLambda(dto: LambdaIngestionDto) {
    // 1) Buscar Project por nombre
    const project = await this.projectRepo.findOne({
      where: { product: dto.teamName },
    });

    if (!project) {
      throw new NotFoundException(`Project not found: ${dto.teamName}`);
    }

    // 2) Crear objeto base del indicator
    const indicatorData: Partial<Indicators> = {
      project,
      projectId: project.id,
      pipelineType: dto.pipelineType,
      runDate: new Date(dto.timestamp),
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
          project.totalDefinedTests,
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
    const run = this.repo.create(indicatorData);
    const savedRun = (await this.repo.save(run)) as Indicators | Indicators[];

    // 5) TypeORM save() puede retornar array, aseguramos retornar single entity
    return Array.isArray(savedRun) ? savedRun[0] : savedRun;
  }

  /**
   * Retrieves indicators for a specific project
   * @param projectId - Project ID
   * @returns Array of indicators (limited to 20 most recent)
   */
  async findByProject(projectId: string): Promise<Indicators[]> {
    return this.repo.find({
      where: { project: { id: projectId } },
      order: { runDate: 'DESC' },
      take: 20,
    });
  }

  /**
   * Deletes a single indicator
   * @param id - Indicator ID
   * @throws NotFoundException if indicator doesn't exist
   */
  async delete(id: string): Promise<void> {
    const testRun = await this.repo.findOne({ where: { id } });

    if (!testRun) {
      throw new NotFoundException(ERROR_MESSAGES.INDICATOR_NOT_FOUND);
    }

    await this.repo.remove(testRun);
    this.logger.log(`Indicator deleted: ${id}`);
  }

  /**
   * Deletes all indicators for a specific project
   * @param projectId - Project ID
   * @returns Number of deleted indicators
   * @throws NotFoundException if project doesn't exist
   */
  async deleteAllByProject(projectId: string): Promise<number> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(ERROR_MESSAGES.PROJECT_NOT_FOUND);
    }

    const indicators = await this.repo.find({
      where: { project: { id: projectId } },
    });

    if (indicators.length > 0) {
      await this.repo.remove(indicators);
      this.logger.log(
        `Deleted ${indicators.length} indicators for project: ${project.product}`,
      );
    }

    return indicators.length;
  }

  /**
   * Finds a project by its product name
   * @param teamName - Project/team name
   * @returns Project entity
   * @throws NotFoundException if project doesn't exist
   * @private
   */
  private async findProjectByName(teamName: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { product: teamName },
    });

    if (!project) {
      throw new NotFoundException(
        `${ERROR_MESSAGES.PROJECT_NOT_FOUND}: ${teamName}`,
      );
    }

    return project;
  }
}
