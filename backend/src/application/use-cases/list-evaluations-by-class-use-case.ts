import { Evaluation } from "../../domain/entities/evaluation";
import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";
import { IEvaluationRepository } from "../../domain/repositories/evaluation-repository";
import { NotFoundError } from "../errors/not-found-error";

export interface ClassEvaluationsResult {
  classId: string;
  studentIds: string[];
  goalIds: string[];
  evaluations: Evaluation[];
}

export class ListEvaluationsByClassUseCase {
  constructor(
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly classGroupRepository: IClassGroupRepository
  ) {}

  async execute(classId: string): Promise<ClassEvaluationsResult> {
    const classGroup = await this.classGroupRepository.findById(classId);
    if (!classGroup) {
      throw new NotFoundError("Turma não encontrada.");
    }
    const evaluations = await this.evaluationRepository.findByClassId(classId);
    return {
      classId,
      studentIds: [...classGroup.studentIds],
      goalIds: [...classGroup.goalIds],
      evaluations
    };
  }
}
