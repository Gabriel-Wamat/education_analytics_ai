import { AlternativeIdentificationType } from "./alternative-identification-type";
import { ExamHeaderMetadata } from "./exam-header-metadata";
import { Question } from "./question";

export interface ExamTemplate {
  id: string;
  title: string;
  headerMetadata: ExamHeaderMetadata | null;
  questionsSnapshot: Question[];
  alternativeIdentificationType: AlternativeIdentificationType;
  createdAt: Date;
  updatedAt: Date;
}
