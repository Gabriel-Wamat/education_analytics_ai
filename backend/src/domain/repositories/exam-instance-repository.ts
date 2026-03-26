import { ExamInstance } from "../entities/exam-instance";

export interface IExamInstanceRepository {
  createMany(examInstances: ExamInstance[]): Promise<ExamInstance[]>;
  findById(id: string): Promise<ExamInstance | null>;
  findByExamCodes(examCodes: string[]): Promise<ExamInstance[]>;
  findByBatchId(batchId: string): Promise<ExamInstance[]>;
}
