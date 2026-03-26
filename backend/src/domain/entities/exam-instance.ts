import { AlternativeIdentificationType } from "./alternative-identification-type";

export interface ExamInstanceOption {
  originalOptionId: string;
  position: number;
  description: string;
  displayCode: string;
  isCorrect: boolean;
}

export interface ExamInstanceQuestion {
  originalQuestionId: string;
  position: number;
  statement: string;
  randomizedOptions: ExamInstanceOption[];
}

export interface ExamInstance {
  id: string;
  batchId: string;
  examCode: string;
  signature: string;
  templateId: string;
  templateTitle: string;
  alternativeIdentificationType: AlternativeIdentificationType;
  randomizedQuestions: ExamInstanceQuestion[];
  createdAt: Date;
  updatedAt: Date;
}
