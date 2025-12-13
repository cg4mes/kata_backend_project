import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: 'Nombre del producto', example: 'Portal Web' })
  @IsString()
  product: string;

  @ApiProperty({ description: 'Prefijo del proyecto', example: 'PW' })
  @IsString()
  prefix: string;

  @ApiProperty({
    description: 'Total de tests definidos',
    example: 150,
  })
  @IsNumber()
  @IsPositive()
  totalDefinedTests: number;
}
