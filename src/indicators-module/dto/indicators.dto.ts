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
    description: 'Nombre del equipo o proyecto al que pertenece esta ejecución',
    example: 'QA Team Alpha',
  })
  @IsString()
  teamName!: string;

  @ApiProperty({
    description: 'Tipo de pipeline de pruebas ejecutado',
    enum: ['regression', 'security', 'performance'],
    example: 'regression',
  })
  @IsEnum(['regression', 'security', 'performance'])
  pipelineType!: 'regression' | 'security' | 'performance';

  @ApiProperty({
    description: 'Fecha y hora de ejecución en formato ISO 8601 (UTC)',
    example: '2025-12-14T21:30:00.000Z',
  })
  @IsISO8601()
  timestamp!: string;

  // Métricas de pruebas de regresión
  @ApiPropertyOptional({
    description: 'Número de tests que pasaron exitosamente (regression)',
    example: 140,
  })
  @IsOptional()
  @IsNumber()
  passed?: number;

  @ApiPropertyOptional({
    description: 'Número de tests que fallaron (regression)',
    example: 8,
  })
  @IsOptional()
  @IsNumber()
  failed?: number;

  @ApiPropertyOptional({
    description: 'Número de tests omitidos o deshabilitados (regression)',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  skipped?: number;

  @ApiPropertyOptional({
    description: 'Total de tests ejecutados en el pipeline (regression)',
    example: 150,
  })
  @IsOptional()
  @IsNumber()
  totalTests?: number;

  // Métricas de pruebas de seguridad
  @ApiPropertyOptional({
    description:
      'Vulnerabilidades de severidad ALTA detectadas (security - críticas, requieren acción inmediata)',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  high?: number;

  @ApiPropertyOptional({
    description:
      'Vulnerabilidades de severidad MEDIA detectadas (security - importantes, deben corregirse)',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  medium?: number;

  @ApiPropertyOptional({
    description:
      'Vulnerabilidades de severidad BAJA detectadas (security - menor prioridad)',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  low?: number;

  @ApiPropertyOptional({
    description:
      'Vulnerabilidades informativas (security - solo información, no requieren acción)',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  informational?: number;

  // Métricas de pruebas de rendimiento
  @ApiPropertyOptional({
    description:
      'Total de peticiones HTTP realizadas en la prueba de carga (performance)',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  totalRequest?: number;

  @ApiPropertyOptional({
    description: 'Peticiones HTTP exitosas - códigos 2xx y 3xx (performance)',
    example: 980,
  })
  @IsOptional()
  @IsNumber()
  okRequest?: number;

  @ApiPropertyOptional({
    description: 'Peticiones HTTP fallidas - códigos 4xx y 5xx (performance)',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  koRequest?: number;

  @ApiPropertyOptional({
    description: 'Tiempo de respuesta promedio en milisegundos (performance)',
    example: 250,
  })
  @IsOptional()
  @IsNumber()
  timeMean?: number;

  @ApiPropertyOptional({
    description: 'Tiempo de respuesta máximo en milisegundos (performance)',
    example: 1500,
  })
  @IsOptional()
  @IsNumber()
  timeMax?: number;

  @ApiPropertyOptional({
    description: 'Tiempo de respuesta mínimo en milisegundos (performance)',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  timeMin?: number;
}
