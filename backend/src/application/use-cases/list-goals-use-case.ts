import { Goal } from "../../domain/entities/goal";
import { IGoalRepository } from "../../domain/repositories/goal-repository";

export class ListGoalsUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(): Promise<Goal[]> {
    const goals = await this.goalRepository.findAll();
    return goals.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }
}
