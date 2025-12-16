import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../users-module/guards/auth.guard';

describe('ProjectsModuleController', () => {
	let controller: ProjectsController;

	const mockProjectsService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
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
			controllers: [ProjectsController],
			providers: [
				{
					provide: ProjectsService,
					useValue: mockProjectsService,
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

		controller = module.get<ProjectsController>(ProjectsController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
