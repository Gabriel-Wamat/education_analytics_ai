import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";
import { IEvaluationRepository } from "../../domain/repositories/evaluation-repository";
import { IStudentRepository } from "../../domain/repositories/student-repository";
import { NotFoundError } from "../errors/not-found-error";

export class DeleteStudentUseCase {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly classGroupRepository: IClassGroupRepository,
    private readonly evaluationRepository: IEvaluationRepository
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.studentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Aluno não encontrado.");
    }

    // Cascata: remove o aluno das turmas, depois apaga avaliações relacionadas.
    const classes = await this.classGroupRepository.findByStudentId(id);
    for (const classGroup of classes) {
      await this.classGroupRepository.update({
        ...classGroup,
        studentIds: classGroup.studentIds.filter((studentId) => studentId !== id),
        updatedAt: new Date()
      });
    }
    await this.evaluationRepository.deleteByStudentId(id);
    await this.studentRepository.delete(id);
  }
}
