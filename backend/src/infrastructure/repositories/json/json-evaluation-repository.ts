import { Evaluation } from "../../../domain/entities/evaluation";
import { EvaluationLevel } from "../../../domain/entities/evaluation-level";
import { IEvaluationRepository } from "../../../domain/repositories/evaluation-repository";
import { JsonFileStore } from "../../storage/json-file-store";

interface EvaluationJson {
  id: string;
  classId: string;
  studentId: string;
  goalId: string;
  level: EvaluationLevel;
  createdAt: string;
  updatedAt: string;
}

interface StoreShape {
  evaluations: EvaluationJson[];
}

const reviveEvaluation = (raw: EvaluationJson): Evaluation => ({
  id: raw.id,
  classId: raw.classId,
  studentId: raw.studentId,
  goalId: raw.goalId,
  level: raw.level,
  createdAt: new Date(raw.createdAt),
  updatedAt: new Date(raw.updatedAt)
});

const dehydrateEvaluation = (evaluation: Evaluation): EvaluationJson => ({
  id: evaluation.id,
  classId: evaluation.classId,
  studentId: evaluation.studentId,
  goalId: evaluation.goalId,
  level: evaluation.level,
  createdAt: evaluation.createdAt.toISOString(),
  updatedAt: evaluation.updatedAt.toISOString()
});

export class JsonEvaluationRepository implements IEvaluationRepository {
  private readonly store: JsonFileStore<StoreShape>;

  constructor(filePath: string) {
    this.store = new JsonFileStore<StoreShape>(
      filePath,
      () => ({ evaluations: [] }),
      (raw) => raw as StoreShape
    );
  }

  async findAll(): Promise<Evaluation[]> {
    const state = await this.store.read();
    return state.evaluations.map(reviveEvaluation);
  }

  async findById(id: string): Promise<Evaluation | null> {
    const state = await this.store.read();
    const found = state.evaluations.find((e) => e.id === id);
    return found ? reviveEvaluation(found) : null;
  }

  async findByClassStudentGoal(
    classId: string,
    studentId: string,
    goalId: string
  ): Promise<Evaluation | null> {
    const state = await this.store.read();
    const found = state.evaluations.find(
      (e) => e.classId === classId && e.studentId === studentId && e.goalId === goalId
    );
    return found ? reviveEvaluation(found) : null;
  }

  async findByClassId(classId: string): Promise<Evaluation[]> {
    const state = await this.store.read();
    return state.evaluations.filter((e) => e.classId === classId).map(reviveEvaluation);
  }

  async findByStudentId(studentId: string): Promise<Evaluation[]> {
    const state = await this.store.read();
    return state.evaluations
      .filter((e) => e.studentId === studentId)
      .map(reviveEvaluation);
  }

  async upsert(evaluation: Evaluation): Promise<Evaluation> {
    return this.store.mutate((state) => {
      const index = state.evaluations.findIndex(
        (e) =>
          e.classId === evaluation.classId &&
          e.studentId === evaluation.studentId &&
          e.goalId === evaluation.goalId
      );
      if (index === -1) {
        state.evaluations.push(dehydrateEvaluation(evaluation));
      } else {
        // Preserva o id e createdAt originais quando estamos atualizando.
        const existing = state.evaluations[index];
        state.evaluations[index] = dehydrateEvaluation({
          ...evaluation,
          id: existing.id,
          createdAt: new Date(existing.createdAt)
        });
      }
      return { state, result: reviveEvaluation(state.evaluations[index === -1 ? state.evaluations.length - 1 : index]) };
    });
  }

  async delete(id: string): Promise<void> {
    await this.store.mutate((state) => {
      const next: StoreShape = {
        evaluations: state.evaluations.filter((e) => e.id !== id)
      };
      return { state: next, result: undefined };
    });
  }

  async deleteByClassId(classId: string): Promise<void> {
    await this.store.mutate((state) => {
      const next: StoreShape = {
        evaluations: state.evaluations.filter((e) => e.classId !== classId)
      };
      return { state: next, result: undefined };
    });
  }

  async deleteByStudentId(studentId: string): Promise<void> {
    await this.store.mutate((state) => {
      const next: StoreShape = {
        evaluations: state.evaluations.filter((e) => e.studentId !== studentId)
      };
      return { state: next, result: undefined };
    });
  }

  async deleteByGoalId(goalId: string): Promise<void> {
    await this.store.mutate((state) => {
      const next: StoreShape = {
        evaluations: state.evaluations.filter((e) => e.goalId !== goalId)
      };
      return { state: next, result: undefined };
    });
  }
}
