import { NotFoundError } from "../errors/not-found-error";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";

export class DeleteExamTemplateUseCase {
  constructor(private readonly examTemplateRepository: IExamTemplateRepository) {}

  async execute(id: string): Promise<void> {
    const existingExamTemplate = await this.examTemplateRepository.findById(id);
    if (!existingExamTemplate) {
      throw new NotFoundError("Prova não encontrada.");
    }

    await this.examTemplateRepository.delete(id);
  }
}
