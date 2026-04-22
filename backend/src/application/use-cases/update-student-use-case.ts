import { Student } from "../../domain/entities/student";
import { IStudentRepository } from "../../domain/repositories/student-repository";
import { StudentInput } from "../dto/student-input";
import { ConflictError } from "../errors/conflict-error";
import { NotFoundError } from "../errors/not-found-error";
import { validateStudentInput } from "../validators/student-validator";

export class UpdateStudentUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(id: string, input: StudentInput): Promise<Student> {
    const existing = await this.studentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Aluno não encontrado.");
    }
    const normalized = validateStudentInput(input);

    const conflictByCpf = await this.studentRepository.findByCpf(normalized.cpf);
    if (conflictByCpf && conflictByCpf.id !== id) {
      throw new ConflictError("Já existe outro aluno cadastrado com este CPF.");
    }
    const conflictByEmail = await this.studentRepository.findByEmail(normalized.email);
    if (conflictByEmail && conflictByEmail.id !== id) {
      throw new ConflictError("Já existe outro aluno cadastrado com este email.");
    }

    const updated: Student = {
      ...existing,
      name: normalized.name,
      cpf: normalized.cpf,
      email: normalized.email,
      updatedAt: new Date()
    };
    return this.studentRepository.update(updated);
  }
}
