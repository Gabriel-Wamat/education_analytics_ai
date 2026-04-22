import { Student } from "../../domain/entities/student";
import { IStudentRepository } from "../../domain/repositories/student-repository";

export class ListStudentsUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(): Promise<Student[]> {
    const students = await this.studentRepository.findAll();
    return students.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }
}
