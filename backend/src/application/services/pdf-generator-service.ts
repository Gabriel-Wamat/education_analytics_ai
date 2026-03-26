import { ExamInstance } from "../../domain/entities/exam-instance";
import { GeneratedArtifact } from "../../domain/entities/generated-artifact";

export interface IPdfGeneratorService {
  generateExamPdfs(
    batchId: string,
    instances: ExamInstance[],
    outputDir: string
  ): Promise<GeneratedArtifact[]>;
}
