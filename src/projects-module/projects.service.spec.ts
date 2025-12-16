import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { DynamoDBDatasource } from '../common/datasources/dynamodb.datasource';

describe('ProjectsService', () => {
	let service: ProjectsService;

	const mockDynamoDBDatasource = {
		query: jest.fn(),
		queryGSI: jest.fn(),
		scan: jest.fn(),
		get: jest.fn(),
		put: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProjectsService,
				{
					provide: DynamoDBDatasource,
					useValue: mockDynamoDBDatasource,
				},
			],
		}).compile();

		service = module.get<ProjectsService>(ProjectsService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
