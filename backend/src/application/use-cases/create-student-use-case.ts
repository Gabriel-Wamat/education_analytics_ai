import { randomUUID } from "node:crypto";

import { Student } from "../../domain/entities/student";
import { IStudentRepository } from "../../domain/repositories/student-repository";
import { StudentInput } from "../dto/student-input";
import { ConflictError } from "../errors/conflict-error";
import { validateStudentInput } from "../validators/student-validator";

export class CreateStudentUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(input: StudentInput): Promise<Student> {
    const normalized = validateStudentInput(input);

    const existingByCpf = await this.studentRepository.findByCpf(normalized.cpf);
    if (existingByCpf) {
      throw new ConflictError("Já existe um aluno cadastrado com este CPF.");
    }
    const existingByEmail = await this.studentRepository.findByEmail(normalized.email);
    if (existingByEmail) {
      throw new ConflictError("Já existe um aluno cadastrado com este email.");
    }

    const now = new Date();
    const student: Student = {
      id: randomUUID(),
      name: normalized.name,
      cpf: normalized.cpf,
      email: normalized.email,
      createdAt: now,
      updatedAt: now
    };
    return this.studentRepository.create(student);
  }
}
