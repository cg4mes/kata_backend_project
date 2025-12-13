import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class LambdaIngestionDto {
  @ApiProperty({
    description: 'Nombre del equipo/proyecto',
    example: 'QA Team Alpha',
  })
  @IsString()
  teamName: string;

  @ApiProperty({
    description: 'Tipo de pipeline',
    enum: ['regression', 'security', 'performance'],
    example: 'regression',
  })
  @IsEnum(['regression', 'security', 'performance'])
  pipelineType: 'regression' | 'security' | 'performance';

  @ApiProperty({
    description: 'Fecha/hora de ejecución en formato ISO',
    example: '2025-12-11T21:30:00.000Z',
  })
  @IsISO8601()
  timestamp: string;

  // Tests de regresión
  @ApiPropertyOptional({ description: 'Tests pasados', example: 140 })
  @IsOptional()
  @IsNumber()
  passed?: number;

  @ApiPropertyOptional({ description: 'Tests fallidos', example: 8 })
  @IsOptional()
  @IsNumber()
  failed?: number;

  @ApiPropertyOptional({ description: 'Tests omitidos', example: 2 })
  @IsOptional()
  @IsNumber()
  skipped?: number;

  @ApiPropertyOptional({ description: 'Total de tests', example: 150 })
  @IsOptional()
  @IsNumber()
  totalTests?: number;

  // Tests de seguridad
  @ApiPropertyOptional({
    description: 'Vulnerabilidades de severidad alta',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  high?: number;

  @ApiPropertyOptional({
    description: 'Vulnerabilidades de severidad media',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  medium?: number;

  @ApiPropertyOptional({
    description: 'Vulnerabilidades de severidad baja',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  low?: number;

  @ApiPropertyOptional({
    description: 'Vulnerabilidades informativas',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  informational?: number;

  // Tests de performance
  @ApiPropertyOptional({ description: 'Total de peticiones', example: 1000 })
  @IsOptional()
  @IsNumber()
  totalRequest?: number;

  @ApiPropertyOptional({ description: 'Peticiones exitosas', example: 980 })
  @IsOptional()
  @IsNumber()
  okRequest?: number;

  @ApiPropertyOptional({ description: 'Peticiones fallidas', example: 20 })
  @IsOptional()
  @IsNumber()
  koRequest?: number;

  @ApiPropertyOptional({ description: 'Tiempo promedio (ms)', example: 250 })
  @IsOptional()
  @IsNumber()
  timeMean?: number;

  @ApiPropertyOptional({ description: 'Tiempo máximo (ms)', example: 1500 })
  @IsOptional()
  @IsNumber()
  timeMax?: number;

  @ApiPropertyOptional({ description: 'Tiempo mínimo (ms)', example: 50 })
  @IsOptional()
  @IsNumber()
  timeMin?: number;
}
