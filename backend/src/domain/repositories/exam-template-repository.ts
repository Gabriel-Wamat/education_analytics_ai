import { ExamTemplate } from "../entities/exam-template";

export interface IExamTemplateRepository {
  create(examTemplate: ExamTemplate): Promise<ExamTemplate>;
  findAll(): Promise<ExamTemplate[]>;
  findById(id: string): Promise<ExamTemplate | null>;
  update(examTemplate: ExamTemplate): Promise<ExamTemplate>;
  delete(id: string): Promise<void>;
}
