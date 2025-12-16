import { ApiProperty } from '@nestjs/swagger';

export class ProjectMetricsDto {
	@ApiProperty({ description: 'Promedio de tasa de éxito (regression)' })
	averageSuccessRate!: number;

	@ApiProperty({ description: 'Cobertura actual (regression)' })
	currentCoverage!: number;

	@ApiProperty({ description: 'Cantidad de test runs' })
	testRunsCount!: number;

	@ApiProperty({
		description: 'Promedio de error rate (performance)',
		required: false,
	})
	averageErrorRate?: number;

	@ApiProperty({
		description: 'Promedio de security score (security)',
		required: false,
	})
	averageSecurityScore?: number;
}

export class ProjectWithMetricsDto {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	product!: string;

	@ApiProperty()
	prefix!: string;

	@ApiProperty()
	totalDefinedTests!: number;

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty()
	updatedAt!: Date;

	@ApiProperty({ type: ProjectMetricsDto })
	metrics!: ProjectMetricsDto;
}
