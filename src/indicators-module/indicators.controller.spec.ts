import { Test, TestingModule } from '@nestjs/testing';
import { IndicatorsController } from './indicators.controller';
import { IndicatorsService } from './indicators.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../users-module/guards/auth.guard';

describe('IndicatorsController', () => {
	let controller: IndicatorsController;

	const mockIndicatorsService = {
		getProjectIndicators: jest.fn(),
		getAllProjectsIndicators: jest.fn(),
	};

	const mockJwtService = {
		sign: jest.fn(),
		verify: jest.fn(),
	};

	const mockConfigService = {
		get: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [IndicatorsController],
			providers: [
				{
					provide: IndicatorsService,
					useValue: mockIndicatorsService,
				},
				{
					provide: JwtService,
					useValue: mockJwtService,
				},
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		})
			.overrideGuard(AuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<IndicatorsController>(IndicatorsController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
