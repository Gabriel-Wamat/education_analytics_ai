import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";
import { IEvaluationRepository } from "../../domain/repositories/evaluation-repository";
import { NotFoundError } from "../errors/not-found-error";

export class DeleteClassGroupUseCase {
  constructor(
    private readonly classGroupRepository: IClassGroupRepository,
    private readonly evaluationRepository: IEvaluationRepository
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.classGroupRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Turma não encontrada.");
    }
    await this.evaluationRepository.deleteByClassId(id);
    await this.classGroupRepository.delete(id);
  }
}
