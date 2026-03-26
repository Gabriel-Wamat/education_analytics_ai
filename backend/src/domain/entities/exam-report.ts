import { GradingStrategyType } from "./grading-strategy-type";

export interface ExamReportQuestionResult {
  originalQuestionId: string;
  questionPositionInTemplate: number;
  expectedAnswer: string;
  actualAnswer: string;
  score: number;
  selectedOptionIds: string[];
  wasFullyCorrect: boolean;
}

export interface ExamReportStudentResult {
  studentId: string;
  studentName?: string;
  examCode: string;
  totalScore: number;
  percentage: number;
  questionResults: ExamReportQuestionResult[];
}

export interface ExamReport {
  id: string;
  batchId: string;
  templateId: string;
  templateTitle: string;
  gradingStrategyType: GradingStrategyType;
  studentsSnapshot: ExamReportStudentResult[];
  createdAt: Date;
  updatedAt: Date;
}
