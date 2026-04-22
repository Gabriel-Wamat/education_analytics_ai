import { EvaluationLevel } from "../../domain/entities/evaluation-level";

export interface SetEvaluationInput {
  classId: string;
  studentId: string;
  goalId: string;
  level: EvaluationLevel;
}
