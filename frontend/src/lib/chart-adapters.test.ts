import {
  getBarChartSeries,
  getDonutChartGroups,
  getLineChartSeries,
  getUnitPerformanceLineChartSeries
} from "@/lib/chart-adapters";
import { DashboardMetricsResponse } from "@/types/api";

const metricsFixture: DashboardMetricsResponse = {
  examId: "exam-1",
  batchId: "batch-1",
  templateId: "template-1",
  templateTitle: "Prova de Matemática",
  gradingStrategyType: "STRICT",
  summary: {
    totalStudents: 10,
    totalQuestions: 2,
    averageScore: 1.5,
    averagePercentage: 75,
    highestScore: 2,
    lowestScore: 1
  },
  lineChartData: [
    {
      questionId: "q2",
      unit: 2,
      order: 2,
      label: "Q2",
      statement: "Questão 2",
      averageScore: 1,
      averagePercentage: 100,
      fullCorrectRate: 100
    },
    {
      questionId: "q1",
      unit: 1,
      order: 1,
      label: "Q1",
      statement: "Questão 1",
      averageScore: 0.5,
      averagePercentage: 50,
      fullCorrectRate: 40
    }
  ],
  barChartData: [
    {
      questionId: "q2",
      order: 2,
      label: "Q2",
      statement: "Questão 2",
      accuracyRate: 100,
      averageScoreRate: 100,
      totalStudents: 10
    },
    {
      questionId: "q1",
      order: 1,
      label: "Q1",
      statement: "Questão 1",
      accuracyRate: 40,
      averageScoreRate: 50,
      totalStudents: 10
    }
  ],
  donutChartsByQuestion: [
    {
      questionId: "q2",
      order: 2,
      label: "Q2",
      statement: "Questão 2",
      data: []
    },
    {
      questionId: "q1",
      order: 1,
      label: "Q1",
      statement: "Questão 1",
      data: []
    }
  ]
};

describe("chart adapters", () => {
  it("sorts line and bar data by question order", () => {
    expect(getLineChartSeries(metricsFixture).map((item) => item.questionId)).toEqual([
      "q1",
      "q2"
    ]);
    expect(getBarChartSeries(metricsFixture).map((item) => item.questionId)).toEqual([
      "q1",
      "q2"
    ]);
  });

  it("sorts donut groups by question order", () => {
    expect(getDonutChartGroups(metricsFixture).map((item) => item.questionId)).toEqual([
      "q1",
      "q2"
    ]);
  });

  it("builds dynamic unit series for the dashboard", () => {
    const series = getUnitPerformanceLineChartSeries(metricsFixture);

    expect(series.units).toEqual([
      { key: "unit_1", unit: 1, label: "Unidade 1" },
      { key: "unit_2", unit: 2, label: "Unidade 2" }
    ]);
    expect(series.data).toEqual([
      {
        label: "Item 1",
        unit_1: 50,
        unit_2: 100
      }
    ]);
  });
});
