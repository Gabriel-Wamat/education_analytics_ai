import { GeneratedArtifactKind } from "./generated-artifact";

export interface ExamArtifact {
  id: string;
  batchId: string;
  kind: GeneratedArtifactKind;
  fileName: string;
  mimeType: string;
  absolutePath: string | null;
  sizeInBytes: number;
  createdAt: Date;
  downloadUrl?: string;
}

export interface StoredExamArtifact extends ExamArtifact {
  content: Buffer;
}

export interface CreateStoredExamArtifactInput {
  id: string;
  batchId: string;
  kind: GeneratedArtifactKind;
  fileName: string;
  mimeType: string;
  absolutePath: string | null;
  sizeInBytes: number;
  content: Buffer;
  createdAt: Date;
}
