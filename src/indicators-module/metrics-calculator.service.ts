import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsCalculatorService {
	/**
	 * Calcula el porcentaje de éxito de ejecución
	 * @param passed - Número de tests pasados
	 * @param totalTests - Número total de tests ejecutados
	 * @returns Porcentaje de éxito (0-100)
	 */
	calculateExecutionSuccessRate(passed: number, totalTests: number): number {
		if (totalTests === 0) return 0;
		return (passed / totalTests) * 100;
	}

	/**
	 * Calcula el porcentaje de cobertura de automatización
	 * @param totalTests - Total de tests ejecutados
	 * @param totalDefinedTests - Total de tests definidos en el proyecto
	 * @returns Porcentaje de cobertura (0-100)
	 */
	calculateAutomationCoverage(totalTests: number, totalDefinedTests: number): number {
		if (totalDefinedTests === 0) return 0;
		return (totalTests / totalDefinedTests) * 100;
	}
}
