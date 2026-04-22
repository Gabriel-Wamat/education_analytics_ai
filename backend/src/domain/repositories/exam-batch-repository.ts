import { ExamBatch } from "../entities/exam-batch";
import { CreateStoredExamArtifactInput, StoredExamArtifact } from "../entities/exam-artifact";

export interface CreateExamBatchInput {
  id: string;
  templateId: string;
  templateTitle: string;
  quantity: number;
  createdAt: Date;
  artifacts: CreateStoredExamArtifactInput[];
}

export interface IExamBatchRepository {
  create(input: CreateExamBatchInput): Promise<ExamBatch>;
  findById(id: string): Promise<ExamBatch | null>;
  findByTemplateId(templateId: string): Promise<ExamBatch[]>;
  findArtifactById(id: string): Promise<StoredExamArtifact | null>;
}
