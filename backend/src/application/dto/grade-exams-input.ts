import { GradingStrategyType } from "../../domain/entities/grading-strategy-type";
import { BinaryFileInput } from "./binary-file-input";

export interface GradeExamsInput {
  answerKeyFile: BinaryFileInput;
  studentResponsesFile: BinaryFileInput;
  gradingStrategyType: GradingStrategyType;
}
