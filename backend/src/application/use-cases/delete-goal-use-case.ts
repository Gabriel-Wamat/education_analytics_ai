import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";
import { IEvaluationRepository } from "../../domain/repositories/evaluation-repository";
import { IGoalRepository } from "../../domain/repositories/goal-repository";
import { NotFoundError } from "../errors/not-found-error";

export class DeleteGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly classGroupRepository: IClassGroupRepository,
    private readonly evaluationRepository: IEvaluationRepository
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.goalRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Meta não encontrada.");
    }
    const classes = await this.classGroupRepository.findByGoalId(id);
    for (const classGroup of classes) {
      await this.classGroupRepository.update({
        ...classGroup,
        goalIds: classGroup.goalIds.filter((goalId) => goalId !== id),
        updatedAt: new Date()
      });
    }
    await this.evaluationRepository.deleteByGoalId(id);
    await this.goalRepository.delete(id);
  }
}
