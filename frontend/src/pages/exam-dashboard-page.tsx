import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { AlternativeDistributionDonuts } from "@/components/charts/alternative-distribution-donuts";
import { PerformanceLineChart } from "@/components/charts/performance-line-chart";
import { QuestionAccuracyBarChart } from "@/components/charts/question-accuracy-bar-chart";
import { UnitPerformanceLineChart } from "@/components/charts/unit-performance-line-chart";
import { InsightsPanel } from "@/features/dashboard/insights-panel";
import { MetricsSummaryCards } from "@/features/dashboard/metrics-summary-cards";
import { useExamInsights, useExamMetrics } from "@/features/dashboard/hooks";
import {
  getBarChartSeries,
  getDonutChartGroups,
  getLineChartSeries,
  getUnitPerformanceLineChartSeries
} from "@/lib/chart-adapters";
import { isApiErrorWithStatus, normalizeApiError } from "@/services/http/error";
import { DashboardMetricsResponse } from "@/types/api";

const buildEmptyMetrics = (examId?: string): DashboardMetricsResponse => ({
  examId: examId ?? "",
  batchId: "",
  templateId: "",
  templateTitle: "Sem dados carregados",
  gradingStrategyType: "STRICT",
  summary: {
    totalStudents: 0,
    totalQuestions: 0,
    averageScore: 0,
    averagePercentage: 0,
    highestScore: 0,
    lowestScore: 0
  },
  lineChartData: [],
  barChartData: [],
  donutChartsByQuestion: []
});

export const ExamDashboardPage = () => {
  const { examId = "" } = useParams();
  const metricsQuery = useExamMetrics(examId);
  const insightsQuery = useExamInsights(examId);
  const hasNoExamSelected = examId.length === 0;
  const hasNoMetricsYet =
    metricsQuery.isError && isApiErrorWithStatus(metricsQuery.error, 404);

  const metrics = metricsQuery.data ?? (hasNoExamSelected || hasNoMetricsYet ? buildEmptyMetrics(examId) : null);
  const lineData = useMemo(
    () => (metrics ? getLineChartSeries(metrics) : []),
    [metrics]
  );
  const barData = useMemo(
    () => (metrics ? getBarChartSeries(metrics) : []),
    [metrics]
  );
  const unitLineSeries = useMemo(
    () => (metrics ? getUnitPerformanceLineChartSeries(metrics) : { data: [], units: [] }),
    [metrics]
  );
  const donutGroups = useMemo(
    () => (metrics ? getDonutChartGroups(metrics) : []),
    [metrics]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Desempenho da turma"
        description="Leitura quantitativa e qualitativa do relatório corrigido, com gráficos prontos para tomada de decisão pedagógica. Quando ainda não houver dados, o dashboard permanece disponível com estruturas vazias."
      />

      {metricsQuery.isLoading && !hasNoExamSelected ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-[340px] w-full" />
          <Skeleton className="h-[340px] w-full" />
        </div>
      ) : null}

      {hasNoExamSelected ? (
        <Alert tone="info">
          O dashboard já está disponível. Assim que você corrigir uma turma, os gráficos serão preenchidos automaticamente.
        </Alert>
      ) : null}

      {hasNoMetricsYet ? (
        <Alert tone="info">
          Ainda não há métricas para este relatório. Os gráficos permanecem vazios até que os dados sejam gerados.
        </Alert>
      ) : null}

      {metricsQuery.isError && !hasNoMetricsYet ? (
        <Alert tone="danger">{normalizeApiError(metricsQuery.error).message}</Alert>
      ) : null}

      {metrics ? (
        <>
          <MetricsSummaryCards summary={metrics.summary} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
            <PerformanceLineChart data={lineData} />
            <InsightsPanel
              isLoading={!hasNoExamSelected && !hasNoMetricsYet && insightsQuery.isLoading}
              isError={!hasNoExamSelected && !hasNoMetricsYet && insightsQuery.isError}
              warning={
                hasNoExamSelected
                  ? "Os insights serão carregados quando houver um relatório corrigido."
                  : hasNoMetricsYet
                    ? "Ainda não há dados suficientes para gerar insights pedagógicos."
                    : insightsQuery.data?.warning
              }
              insights={
                hasNoExamSelected || hasNoMetricsYet
                  ? null
                  : insightsQuery.data?.insights ?? null
              }
              onRetry={() => {
                if (!hasNoExamSelected) {
                  void insightsQuery.refetch();
                }
              }}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <UnitPerformanceLineChart series={unitLineSeries} />
            <QuestionAccuracyBarChart data={barData} />
          </div>

          <AlternativeDistributionDonuts groups={donutGroups} />
        </>
      ) : null}
    </div>
  );
};
