import { Goal } from "../../../domain/entities/goal";
import { IGoalRepository } from "../../../domain/repositories/goal-repository";
import { JsonFileStore } from "../../storage/json-file-store";

interface GoalJson {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface StoreShape {
  goals: GoalJson[];
}

const reviveGoal = (raw: GoalJson): Goal => ({
  id: raw.id,
  name: raw.name,
  description: raw.description,
  createdAt: new Date(raw.createdAt),
  updatedAt: new Date(raw.updatedAt)
});

const dehydrateGoal = (goal: Goal): GoalJson => ({
  id: goal.id,
  name: goal.name,
  ...(goal.description !== undefined ? { description: goal.description } : {}),
  createdAt: goal.createdAt.toISOString(),
  updatedAt: goal.updatedAt.toISOString()
});

export class JsonGoalRepository implements IGoalRepository {
  private readonly store: JsonFileStore<StoreShape>;

  constructor(filePath: string) {
    this.store = new JsonFileStore<StoreShape>(
      filePath,
      () => ({ goals: [] }),
      (raw) => raw as StoreShape
    );
  }

  async findAll(): Promise<Goal[]> {
    const state = await this.store.read();
    return state.goals.map(reviveGoal);
  }

  async findById(id: string): Promise<Goal | null> {
    const state = await this.store.read();
    const found = state.goals.find((g) => g.id === id);
    return found ? reviveGoal(found) : null;
  }

  async findByName(name: string): Promise<Goal | null> {
    const state = await this.store.read();
    const target = name.trim().toLowerCase();
    const found = state.goals.find((g) => g.name.trim().toLowerCase() === target);
    return found ? reviveGoal(found) : null;
  }

  async findByIds(ids: string[]): Promise<Goal[]> {
    const state = await this.store.read();
    const idSet = new Set(ids);
    return state.goals.filter((g) => idSet.has(g.id)).map(reviveGoal);
  }

  async create(goal: Goal): Promise<Goal> {
    return this.store.mutate((state) => {
      state.goals.push(dehydrateGoal(goal));
      return { state, result: goal };
    });
  }

  async update(goal: Goal): Promise<Goal> {
    return this.store.mutate((state) => {
      const index = state.goals.findIndex((g) => g.id === goal.id);
      if (index === -1) {
        throw new Error(`Meta ${goal.id} não encontrada para atualização.`);
      }
      state.goals[index] = dehydrateGoal(goal);
      return { state, result: goal };
    });
  }

  async delete(id: string): Promise<void> {
    await this.store.mutate((state) => {
      const next: StoreShape = {
        goals: state.goals.filter((g) => g.id !== id)
      };
      return { state: next, result: undefined };
    });
  }
}
