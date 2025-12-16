import { Module } from '@nestjs/common';
import { IndicatorsService } from './indicators.service';
import { IndicatorsController } from './indicators.controller';
import { MetricsCalculatorService } from './metrics-calculator.service';

@Module({
	imports: [],
	providers: [IndicatorsService, MetricsCalculatorService],
	controllers: [IndicatorsController],
})
export class IndicatorsModule {}
