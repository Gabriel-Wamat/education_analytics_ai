import { AlternativeIdentificationType } from "../../domain/entities/alternative-identification-type";

export interface ExamTemplateInput {
  title: string;
  questionIds: string[];
  alternativeIdentificationType: AlternativeIdentificationType;
}
