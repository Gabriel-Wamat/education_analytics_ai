export type AlternativeIdentificationType = "LETTERS" | "POWERS_OF_2";
export type GradingStrategyType = "STRICT" | "PROPORTIONAL";

export interface Option {
  id: string;
  description: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  topic: string;
  unit: number;
  statement: string;
  options: Option[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamTemplate {
  id: string;
  title: string;
  questionsSnapshot: Question[];
  alternativeIdentificationType: AlternativeIdentificationType;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedArtifact {
  kind: "PDF" | "CSV";
  fileName: string;
  absolutePath: string;
  mimeType: string;
}

export interface ExamInstanceOption {
  originalOptionId: string;
  position: number;
  description: string;
  displayCode: string;
  isCorrect: boolean;
}

export interface ExamInstanceQuestion {
  originalQuestionId: string;
  position: number;
  statement: string;
  randomizedOptions: ExamInstanceOption[];
}

export interface ExamInstance {
  id: string;
  batchId: string;
  examCode: string;
  signature: string;
  templateId: string;
  templateTitle: string;
  alternativeIdentificationType: AlternativeIdentificationType;
  randomizedQuestions: ExamInstanceQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateExamInstancesResponse {
  batchId: string;
  quantity: number;
  instances: ExamInstance[];
  artifacts: GeneratedArtifact[];
}

export interface GradedQuestionResult {
  questionPosition: number;
  originalQuestionId: string;
  questionPositionInTemplate: number;
  expectedAnswer: string;
  actualAnswer: string;
  score: number;
  selectedOptionIds: string[];
  wasFullyCorrect: boolean;
}

export interface GradedStudentResult {
  studentId: string;
  studentName?: string;
  examCode: string;
  totalScore: number;
  percentage: number;
  questionResults: GradedQuestionResult[];
}

export interface GradeExamsResponse {
  examId: string;
  strategy: GradingStrategyType;
  totalStudents: number;
  averageScore: number;
  students: GradedStudentResult[];
}

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

export interface ClassInsightsResponse {
  examId: string;
  metrics: DashboardMetricsResponse;
  insights: string | null;
  warning?: string;
  generatedAt: string;
}

export interface ApiErrorPayload {
  message: string;
  details?: string[];
}
