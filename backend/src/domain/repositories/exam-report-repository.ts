import { ExamReport } from "../entities/exam-report";

export interface IExamReportRepository {
  create(examReport: ExamReport): Promise<ExamReport>;
  findById(id: string): Promise<ExamReport | null>;
  findLatest(): Promise<ExamReport | null>;
}
