import { ExamArtifact } from "./exam-artifact";

export interface ExamBatch {
  id: string;
  templateId: string;
  templateTitle: string;
  quantity: number;
  createdAt: Date;
  artifacts: ExamArtifact[];
}
