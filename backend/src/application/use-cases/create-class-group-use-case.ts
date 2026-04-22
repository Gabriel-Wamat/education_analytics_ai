import { randomUUID } from "node:crypto";

import { ClassGroup } from "../../domain/entities/class-group";
import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";
import { IGoalRepository } from "../../domain/repositories/goal-repository";
import { IStudentRepository } from "../../domain/repositories/student-repository";
import { ClassGroupInput } from "../dto/class-group-input";
import { NotFoundError } from "../errors/not-found-error";
import { validateClassGroupInput } from "../validators/class-group-validator";

export class CreateClassGroupUseCase {
  constructor(
    private readonly classGroupRepository: IClassGroupRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly goalRepository: IGoalRepository
  ) {}

  async execute(input: ClassGroupInput): Promise<ClassGroup> {
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

    const now = new Date();
    const classGroup: ClassGroup = {
      id: randomUUID(),
      topic: normalized.topic,
      year: normalized.year,
      semester: normalized.semester,
      studentIds: normalized.studentIds,
      goalIds: normalized.goalIds,
      createdAt: now,
      updatedAt: now
    };
    return this.classGroupRepository.create(classGroup);
  }
}
