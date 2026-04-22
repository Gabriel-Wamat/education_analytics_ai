import { ClassGroup } from "../../domain/entities/class-group";
import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";
import { IEvaluationRepository } from "../../domain/repositories/evaluation-repository";
import { IGoalRepository } from "../../domain/repositories/goal-repository";
import { IStudentRepository } from "../../domain/repositories/student-repository";
import { ClassGroupInput } from "../dto/class-group-input";
import { NotFoundError } from "../errors/not-found-error";
import { validateClassGroupInput } from "../validators/class-group-validator";

export class UpdateClassGroupUseCase {
  constructor(
    private readonly classGroupRepository: IClassGroupRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly goalRepository: IGoalRepository,
    private readonly evaluationRepository: IEvaluationRepository
  ) {}

  async execute(id: string, input: ClassGroupInput): Promise<ClassGroup> {
    const existing = await this.classGroupRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Turma não encontrada.");
    }
    const normalized = validateClassGroupInput(input);

    if (normalized.studentIds.length > 0) {
      const found = await this.studentRepository.findByIds(normalized.studentIds);
      if (found.length !== normalized.studentIds.length) {
        throw new NotFoundError("Um ou mais alunos informados não existem.");
      }
    }
    if (normalized.goalIds.length > 0) {
      const found = await this.goalRepository.findByIds(normalized.goalIds);
      if (found.length !== normalized.goalIds.length) {
        throw new NotFoundError("Uma ou mais metas informadas não existem.");
      }
    }

    const updated: ClassGroup = {
      ...existing,
      topic: normalized.topic,
      year: normalized.year,
      semester: normalized.semester,
      studentIds: normalized.studentIds,
      goalIds: normalized.goalIds,
      updatedAt: new Date()
    };

    // Limpa avaliações órfãs (alunos/metas removidos da turma).
    const newStudentSet = new Set(updated.studentIds);
    const newGoalSet = new Set(updated.goalIds);
    const evaluations = await this.evaluationRepository.findByClassId(id);
    for (const evaluation of evaluations) {
      if (!newStudentSet.has(evaluation.studentId) || !newGoalSet.has(evaluation.goalId)) {
        await this.evaluationRepository.delete(evaluation.id);
      }
    }

    return this.classGroupRepository.update(updated);
  }
}
