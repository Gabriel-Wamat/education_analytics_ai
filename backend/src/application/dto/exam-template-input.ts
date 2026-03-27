import { AlternativeIdentificationType } from "../../domain/entities/alternative-identification-type";
import { ExamHeaderMetadata } from "../../domain/entities/exam-header-metadata";

export interface ExamTemplateInput {
  title: string;
  headerMetadata: ExamHeaderMetadata;
  questionIds: string[];
  alternativeIdentificationType: AlternativeIdentificationType;
}
