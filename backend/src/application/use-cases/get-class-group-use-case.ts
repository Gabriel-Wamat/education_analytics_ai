import { ClassGroup } from "../../domain/entities/class-group";
import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";
import { NotFoundError } from "../errors/not-found-error";

export class GetClassGroupUseCase {
  constructor(private readonly classGroupRepository: IClassGroupRepository) {}

  async execute(id: string): Promise<ClassGroup> {
    const classGroup = await this.classGroupRepository.findById(id);
    if (!classGroup) {
      throw new NotFoundError("Turma não encontrada.");
    }
    return classGroup;
  }
}
