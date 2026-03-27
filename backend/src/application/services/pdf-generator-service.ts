import { ExamTemplate } from "../../domain/entities/exam-template";
import { ExamInstance } from "../../domain/entities/exam-instance";
import { GeneratedArtifact } from "../../domain/entities/generated-artifact";

export interface IPdfGeneratorService {
  generateExamPdfs(
    batchId: string,
    examTemplate: ExamTemplate,
    instances: ExamInstance[],
    outputDir: string
  ): Promise<GeneratedArtifact[]>;
}
