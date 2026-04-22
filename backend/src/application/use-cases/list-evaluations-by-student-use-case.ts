import { Evaluation } from "../../domain/entities/evaluation";
import { IEvaluationRepository } from "../../domain/repositories/evaluation-repository";
import { IStudentRepository } from "../../domain/repositories/student-repository";
import { NotFoundError } from "../errors/not-found-error";

export class ListEvaluationsByStudentUseCase {
  constructor(
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly studentRepository: IStudentRepository
  ) {}

  async execute(studentId: string): Promise<Evaluation[]> {
    const student = await this.studentRepository.findById(studentId);
    if (!student) throw new NotFoundError("Aluno não encontrado.");
    return this.evaluationRepository.findByStudentId(studentId);
  }
}
