// Devuelve solo los campos públicos de un indicador
export function toIndicatorDto(indicator: Record<string, any>) {
  return {
    id: indicator.id as string | undefined,
    projectId: indicator.projectId as string | undefined,
    pipelineType: indicator.pipelineType as string | undefined,
    runDate: indicator.runDate as string | undefined,
    totalTests: indicator.totalTests as number | undefined,
    passed: indicator.passed as number | undefined,
    failed: indicator.failed as number | undefined,
    skipped: indicator.skipped as number | undefined,
    executionSuccessRate: indicator.executionSuccessRate as number | undefined,
    automationCoverage: indicator.automationCoverage as number | undefined,
    errorRate: indicator.errorRate as number | undefined,
    totalRequest: indicator.totalRequest as number | undefined,
    okRequest: indicator.okRequest as number | undefined,
    koRequest: indicator.koRequest as number | undefined,
    timeMean: indicator.timeMean as number | undefined,
    timeMax: indicator.timeMax as number | undefined,
    timeMin: indicator.timeMin as number | undefined,
    high: indicator.high as number | undefined,
    medium: indicator.medium as number | undefined,
    low: indicator.low as number | undefined,
    informational: indicator.informational as number | undefined,
    securityScore: indicator.securityScore as number | undefined,
  };
}
