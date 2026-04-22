import { Goal } from "../entities/goal";

export interface IGoalRepository {
  create(goal: Goal): Promise<Goal>;
  update(goal: Goal): Promise<Goal>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Goal | null>;
  findByName(name: string): Promise<Goal | null>;
  findAll(): Promise<Goal[]>;
  findByIds(ids: string[]): Promise<Goal[]>;
}
