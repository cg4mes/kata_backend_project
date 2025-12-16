import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsOptional } from 'class-validator';

// Solo permitimos actualizar totalDefinedTests
// product y prefix no se pueden cambiar porque son parte de las llaves (PK y GSI2)
export class UpdateProjectDto {
  @ApiProperty({
    description:
      'Número total de casos de prueba definidos en el plan de pruebas del proyecto',
    example: 150,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  totalDefinedTests?: number;
}
