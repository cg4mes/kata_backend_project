import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive } from 'class-validator';

export class CreateProjectDto {
	@ApiProperty({
		description: 'Nombre del producto o aplicación a evaluar',
		example: 'Portal Web',
	})
	@IsString()
	product!: string;

	@ApiProperty({
		description: 'Prefijo o código corto del proyecto (usado para identificación rápida)',
		example: 'PW',
	})
	@IsString()
	prefix!: string;

	@ApiProperty({
		description: 'Número total de casos de prueba definidos en el plan de pruebas del proyecto',
		example: 150,
	})
	@IsNumber()
	@IsPositive()
	totalDefinedTests!: number;
}
