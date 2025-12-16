// Devuelve solo los campos públicos de un indicador
export function toIndicatorDto(indicator: any) {
  return {
    id: indicator.id,
    projectId: indicator.projectId,
    pipelineType: indicator.pipelineType,
    runDate: indicator.runDate,
    totalTests: indicator.totalTests,
    passed: indicator.passed,
    failed: indicator.failed,
    skipped: indicator.skipped,
    executionSuccessRate: indicator.executionSuccessRate,
    automationCoverage: indicator.automationCoverage,
    errorRate: indicator.errorRate,
    totalRequest: indicator.totalRequest,
    okRequest: indicator.okRequest,
    koRequest: indicator.koRequest,
    timeMean: indicator.timeMean,
    timeMax: indicator.timeMax,
    timeMin: indicator.timeMin,
    high: indicator.high,
    medium: indicator.medium,
    low: indicator.low,
    informational: indicator.informational,
    securityScore: indicator.securityScore,
  };
}
