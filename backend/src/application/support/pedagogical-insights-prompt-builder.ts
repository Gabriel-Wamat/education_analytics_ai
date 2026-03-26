import { DashboardMetricsResponse } from "../dto/dashboard-metrics-response";

const buildSerializablePayload = (metrics: DashboardMetricsResponse) => ({
  examId: metrics.examId,
  batchId: metrics.batchId,
  templateId: metrics.templateId,
  templateTitle: metrics.templateTitle,
  gradingStrategyType: metrics.gradingStrategyType,
  summary: metrics.summary,
  lineChartData: metrics.lineChartData,
  barChartData: metrics.barChartData,
  donutChartsByQuestion: metrics.donutChartsByQuestion
});

export const buildPedagogicalInsightsPrompt = (
  metrics: DashboardMetricsResponse
): string => {
  const payload = JSON.stringify(buildSerializablePayload(metrics), null, 2);

  return [
    "Você é um Assistente Pedagógico experiente.",
    "Analise as métricas agregadas de uma turma e responda em Markdown simples.",
    "Explique de forma objetiva:",
    "1. O desempenho geral da turma.",
    "2. Quais questões tiveram mais dificuldade.",
    "3. Quais distratores apareceram com mais frequência.",
    "4. Quais focos de revisão o professor deve priorizar.",
    "Não invente dados e não mencione alunos individualmente.",
    "Baseie-se somente nos dados fornecidos abaixo:",
    payload
  ].join("\n\n");
};
