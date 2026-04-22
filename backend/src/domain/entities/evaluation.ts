import { EvaluationLevel } from "./evaluation-level";

export interface Evaluation {
  id: string;
  classId: string;
  studentId: string;
  goalId: string;
  level: EvaluationLevel;
  createdAt: Date;
  updatedAt: Date;
}
