import { GradingStrategyType } from "../../domain/entities/grading-strategy-type";

export interface DashboardSummary {
  totalStudents: number;
  totalQuestions: number;
  averageScore: number;
  averagePercentage: number;
  highestScore: number;
  lowestScore: number;
}

export interface LineChartData {
  questionId: string;
  unit: number;
  order: number;
  label: string;
  statement: string;
  averageScore: number;
  averagePercentage: number;
  fullCorrectRate: number;
}

export interface BarChartData {
  questionId: string;
  order: number;
  label: string;
  statement: string;
  accuracyRate: number;
  averageScoreRate: number;
  totalStudents: number;
}

export interface DonutChartData {
  questionId: string;
  optionId: string;
  label: string;
  description: string;
  value: number;
  shareOfMarks: number;
  selectionRate: number;
  isCorrect: boolean;
}

export interface DonutChartQuestionGroup {
  questionId: string;
  order: number;
  label: string;
  statement: string;
  data: DonutChartData[];
}

export interface DashboardMetricsResponse {
  examId: string;
  batchId: string;
  templateId: string;
  templateTitle: string;
  gradingStrategyType: GradingStrategyType;
  summary: DashboardSummary;
  lineChartData: LineChartData[];
  barChartData: BarChartData[];
  donutChartsByQuestion: DonutChartQuestionGroup[];
}
