import { Evaluation } from "../entities/evaluation";

export interface IEvaluationRepository {
  upsert(evaluation: Evaluation): Promise<Evaluation>;
  delete(id: string): Promise<void>;
  deleteByClassId(classId: string): Promise<void>;
  deleteByStudentId(studentId: string): Promise<void>;
  deleteByGoalId(goalId: string): Promise<void>;
  findById(id: string): Promise<Evaluation | null>;
  findByClassStudentGoal(
    classId: string,
    studentId: string,
    goalId: string
  ): Promise<Evaluation | null>;
  findByClassId(classId: string): Promise<Evaluation[]>;
  findByStudentId(studentId: string): Promise<Evaluation[]>;
  findAll(): Promise<Evaluation[]>;
}
