import { Student } from "../../domain/entities/student";
import { IStudentRepository } from "../../domain/repositories/student-repository";
import { NotFoundError } from "../errors/not-found-error";

export class GetStudentUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(id: string): Promise<Student> {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new NotFoundError("Aluno não encontrado.");
    }
    return student;
  }
}
