import {
  Body,
  Headers,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IndicatorsService } from './indicators.service';
import { LambdaIngestionDto } from './dto/indicators.dto';
import { AuthGuard } from '../users-module/guards/auth.guard';
import { RolesGuard } from '../users-module/guards/roles.guard';
import { Roles } from '../users-module/decorators/roles.decorator';
import { UserRole } from '../users-module/users.entity';

@ApiTags('indicators')
@Controller('indicators')
export class IndicatorsController {
  constructor(private readonly service: IndicatorsService) {}

  @Post('test-runs')
  @ApiOperation({ summary: 'Ingerir datos de test runs desde Lambda' })
  @ApiHeader({
    name: 'x-internal-token',
    description: 'Token de autenticación interno',
    required: true,
  })
  @ApiResponse({ status: 201, description: 'Indicador creado exitosamente' })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  ingestTestRun(
    @Body() dto: LambdaIngestionDto,
    @Headers('x-internal-token') token: string,
  ) {
    if (token !== process.env.INTERNAL_TOKEN) {
      console.warn(
        'Unauthorized access attempt with token:',
        process.env.INTERNAL_TOKEN,
      );
      throw new UnauthorizedException('Invalid token');
    }
    return this.service.createFromLambda(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener indicadores por proyecto' })
  @ApiQuery({
    name: 'projectId',
    description: 'ID del proyecto',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Lista de indicadores' })
  findByProject(@Query('projectId') projectId: string) {
    return this.service.findByProject(projectId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un indicador (solo admin)' })
  @ApiResponse({ status: 200, description: 'Indicador eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Indicador no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos (solo admin)' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.service.delete(id);
    return { message: 'Test run deleted successfully' };
  }

  @Delete('project/:projectId/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar todos los indicadores de un proyecto (solo admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Indicadores eliminados exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos (solo admin)' })
  async removeAllByProject(
    @Param('projectId') projectId: string,
  ): Promise<{ message: string; count: number }> {
    const count = await this.service.deleteAllByProject(projectId);
    return { message: 'All test runs deleted successfully', count };
  }
}
