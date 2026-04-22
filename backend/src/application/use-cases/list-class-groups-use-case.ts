import { ClassGroup } from "../../domain/entities/class-group";
import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";

export class ListClassGroupsUseCase {
  constructor(private readonly classGroupRepository: IClassGroupRepository) {}

  async execute(): Promise<ClassGroup[]> {
    const classes = await this.classGroupRepository.findAll();
    return classes.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      if (a.semester !== b.semester) return b.semester - a.semester;
      return a.topic.localeCompare(b.topic, "pt-BR");
    });
  }
}
