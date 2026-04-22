import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import { DashboardMetricsResponse } from "@/types/api";

const {
  useExamMetricsMock,
  useLatestExamMetricsMock,
  useExamInsightsMock,
  useLatestExamInsightsMock
} = vi.hoisted(() => ({
  useExamMetricsMock: vi.fn(),
  useLatestExamMetricsMock: vi.fn(),
  useExamInsightsMock: vi.fn(),
  useLatestExamInsightsMock: vi.fn()
}));

vi.mock("@/features/dashboard/hooks", () => ({
  useExamMetrics: useExamMetricsMock,
  useLatestExamMetrics: useLatestExamMetricsMock,
  useExamInsights: useExamInsightsMock,
  useLatestExamInsights: useLatestExamInsightsMock
}));

import { ExamDashboardPage } from "@/pages/exam-dashboard-page";

describe("ExamDashboardPage", () => {
  beforeEach(() => {
    useExamMetricsMock.mockClear();
    useLatestExamMetricsMock.mockClear();
    useExamInsightsMock.mockClear();
    useLatestExamInsightsMock.mockClear();
  });

  it("keeps the dashboard available with empty charts when no exam id is provided", async () => {
    const emptyMetrics: DashboardMetricsResponse = {
      examId: "",
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
    };

    useExamMetricsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null
    });
    useLatestExamMetricsMock.mockReturnValue({
      data: emptyMetrics,
      isLoading: false,
      isError: false,
      error: null
    });
    useExamInsightsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn()
    });
    useLatestExamInsightsMock.mockReturnValue({
      data: {
        examId: "",
        metrics: emptyMetrics,
        insights: null,
        warning: "Os insights serão carregados quando houver um relatório corrigido.",
        generatedAt: new Date("2026-04-22T00:00:00.000Z").toISOString()
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn()
    });

    renderWithProviders(
      <div style={{ width: 1280, minHeight: 900 }}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<ExamDashboardPage />} />
          </Routes>
        </MemoryRouter>
      </div>
    );

    expect(
      await screen.findByText("Desempenho da turma")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "O gráfico será preenchido assim que houver dados corrigidos para comparar desempenho por questão."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Quando houver dados corrigidos, cada unidade aparecerá com uma linha própria neste gráfico."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Distribuição ainda não disponível")).toBeInTheDocument();
    expect(screen.getByText("0% de desempenho médio")).toBeInTheDocument();
    expect(screen.getByText("Os insights serão carregados quando houver um relatório corrigido.")).toBeInTheDocument();
  });
});
