import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndicatorsService } from './indicators.service';
import { IndicatorsController } from './indicators.controller';
import { Indicators } from './indicators.entity';
import { Project } from '../projects-module/projects.entity';
import { MetricsCalculatorService } from './metrics-calculator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Indicators, Project])],
  providers: [IndicatorsService, MetricsCalculatorService],
  controllers: [IndicatorsController],
})
export class IndicatorsModule {}
