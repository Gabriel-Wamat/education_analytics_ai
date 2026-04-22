import { randomUUID } from "node:crypto";

import { Goal } from "../../domain/entities/goal";
import { IGoalRepository } from "../../domain/repositories/goal-repository";
import { GoalInput } from "../dto/goal-input";
import { ConflictError } from "../errors/conflict-error";
import { validateGoalInput } from "../validators/goal-validator";

export class CreateGoalUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(input: GoalInput): Promise<Goal> {
    const normalized = validateGoalInput(input);
    const conflict = await this.goalRepository.findByName(normalized.name);
    if (conflict) {
      throw new ConflictError("Já existe uma meta com este nome.");
    }
    const now = new Date();
    const goal: Goal = {
      id: randomUUID(),
      name: normalized.name,
      description: normalized.description,
      createdAt: now,
      updatedAt: now
    };
    return this.goalRepository.create(goal);
  }
}
