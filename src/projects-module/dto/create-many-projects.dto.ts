import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';

export class CreateManyProjectsDto {
  @ApiProperty({
    description: 'Lista de proyectos a crear',
    type: [CreateProjectDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectDto)
  teams: CreateProjectDto[];
}
