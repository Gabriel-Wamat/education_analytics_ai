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

export interface ExamHeaderMetadata {
  discipline: string;
  teacher: string;
  examDate: string;
}

export interface ExamTemplate {
  id: string;
  title: string;
  headerMetadata: ExamHeaderMetadata | null;
  questionsSnapshot: Question[];
  alternativeIdentificationType: AlternativeIdentificationType;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedArtifact {
  id: string;
  kind: "PDF" | "CSV";
  fileName: string;
  absolutePath: string | null;
  mimeType: string;
  sizeInBytes: number;
  createdAt: string;
  downloadUrl: string;
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

export interface ExamBatchSummary {
  id: string;
  templateId: string;
  templateTitle: string;
  quantity: number;
  createdAt: string;
  artifacts: GeneratedArtifact[];
}

export interface ExamBatchInstanceDetail {
  id: string;
  examCode: string;
  createdAt: string;
  questionCount: number;
  answerKey: string[];
  questions: Array<{
    position: number;
    statement: string;
    answer: string;
    options: Array<{
      position: number;
      displayCode: string;
      description: string;
      isCorrect: boolean;
    }>;
  }>;
}

export interface ExamBatchDetail {
  id: string;
  templateId: string;
  templateTitle: string;
  quantity: number;
  createdAt: string;
  headerMetadata: ExamHeaderMetadata | null;
  alternativeIdentificationType: AlternativeIdentificationType;
  artifacts: GeneratedArtifact[];
  instances: ExamBatchInstanceDetail[];
}

export interface ExamBatchEmailDispatchAssignment {
  studentId: string;
  studentName: string;
  studentEmail: string;
  examCode: string;
  artifactId: string;
  downloadUrl: string;
  sent: boolean;
  error?: string;
}

export interface ExamBatchEmailDispatchResponse {
  batchId: string;
  classId: string;
  classLabel: string;
  studentsTargeted: number;
  proofsAvailable: number;
  emailsSent: number;
  emailsFailed: number;
  assignments: ExamBatchEmailDispatchAssignment[];
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

// ================================================================
// Student / Class / Evaluation / Email (novos módulos)
// ================================================================

export type EvaluationLevel = "MANA" | "MPA" | "MA";

export interface Student {
  id: string;
  name: string;
  cpf: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfileClassSummary {
  id: string;
  topic: string;
  year: number;
  semester: 1 | 2;
  goalCount: number;
  evaluationCount: number;
}

export interface StudentProfileEvaluationItem {
  id: string;
  classId: string;
  classLabel: string;
  goalId: string;
  goalName: string;
  level: EvaluationLevel;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfileTimelinePoint {
  label: string;
  date: string;
  averageScore: number;
  attainmentPercentage: number;
  evaluatedGoals: number;
}

export interface StudentProfileEmailLogItem {
  id: string;
  subject: string;
  digestDate: string;
  status: "sent" | "failed";
  attemptedAt: string;
  entriesCount: number;
}

export interface StudentProfileResponse {
  student: Student;
  summary: {
    totalClasses: number;
    totalGoals: number;
    totalEvaluations: number;
    manaCount: number;
    mpaCount: number;
    maCount: number;
    attainmentPercentage: number;
  };
  classes: StudentProfileClassSummary[];
  evaluations: StudentProfileEvaluationItem[];
  timeline: StudentProfileTimelinePoint[];
  emailLogs: StudentProfileEmailLogItem[];
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassGroup {
  id: string;
  topic: string;
  year: number;
  semester: 1 | 2;
  studentIds: string[];
  goalIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Evaluation {
  id: string;
  classId: string;
  studentId: string;
  goalId: string;
  level: EvaluationLevel;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  studentId: string;
  studentName: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  digestDate: string;
  classIds: string[];
  goalIds: string[];
  entriesCount: number;
  status: "sent" | "failed";
  attemptedAt: string;
  failureReason?: string;
}

export interface ClassEvaluationsResponse {
  classId: string;
  studentIds: string[];
  goalIds: string[];
  evaluations: Evaluation[];
}

export interface EmailDigestRunResult {
  digestDate: string;
  emailsSent: number;
  entriesProcessed: number;
  emailsFailed: number;
  digestsByStudent: Array<{
    studentId: string;
    email: string;
    name: string;
    entries: number;
    sent: boolean;
    error?: string;
  }>;
}
