import { AlternativeIdentificationType } from "./alternative-identification-type";
import { Question } from "./question";

export interface ExamTemplate {
  id: string;
  title: string;
  questionsSnapshot: Question[];
  alternativeIdentificationType: AlternativeIdentificationType;
  createdAt: Date;
  updatedAt: Date;
}
