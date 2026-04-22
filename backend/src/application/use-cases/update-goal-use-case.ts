import { Goal } from "../../domain/entities/goal";
import { IGoalRepository } from "../../domain/repositories/goal-repository";
import { GoalInput } from "../dto/goal-input";
import { ConflictError } from "../errors/conflict-error";
import { NotFoundError } from "../errors/not-found-error";
import { validateGoalInput } from "../validators/goal-validator";

export class UpdateGoalUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(id: string, input: GoalInput): Promise<Goal> {
    const existing = await this.goalRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Meta não encontrada.");
    }
    const normalized = validateGoalInput(input);
    const conflict = await this.goalRepository.findByName(normalized.name);
    if (conflict && conflict.id !== id) {
      throw new ConflictError("Já existe outra meta com este nome.");
    }
    const updated: Goal = {
      ...existing,
      name: normalized.name,
      description: normalized.description,
      updatedAt: new Date()
    };
    return this.goalRepository.update(updated);
  }
}
