import { Test, TestingModule } from '@nestjs/testing';
import { IndicatorsService } from './indicators.service';
import { DynamoDBDatasource } from '../common/datasources/dynamodb.datasource';
import { MetricsCalculatorService } from './metrics-calculator.service';

describe('IndicatorsService', () => {
	let service: IndicatorsService;

	const mockDynamoDBDatasource = {
		query: jest.fn(),
		queryGSI: jest.fn(),
		scan: jest.fn(),
		get: jest.fn(),
		put: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	};

	const mockMetricsCalculatorService = {
		calculateMetrics: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				IndicatorsService,
				{
					provide: DynamoDBDatasource,
					useValue: mockDynamoDBDatasource,
				},
				{
					provide: MetricsCalculatorService,
					useValue: mockMetricsCalculatorService,
				},
			],
		}).compile();

		service = module.get<IndicatorsService>(IndicatorsService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
