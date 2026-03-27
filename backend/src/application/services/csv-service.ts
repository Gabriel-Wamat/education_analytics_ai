import { ExamInstance } from "../../domain/entities/exam-instance";
import { GeneratedArtifact } from "../../domain/entities/generated-artifact";

export interface AnswerKeyRow {
  examCode: string;
  answers: string[];
}

export interface StudentResponseRow {
  studentId: string;
  studentName?: string;
  examCode: string;
  answers: string[];
}

export interface ICsvService {
  generateAnswerKeyCsv(
    batchId: string,
    instances: ExamInstance[],
    outputDir: string
  ): Promise<GeneratedArtifact>;
  parseAnswerKey(file: Buffer): Promise<AnswerKeyRow[]>;
  parseStudentResponses(file: Buffer): Promise<StudentResponseRow[]>;
}
