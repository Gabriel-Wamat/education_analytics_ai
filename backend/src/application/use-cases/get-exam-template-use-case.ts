import { NotFoundError } from "../errors/not-found-error";
import { ExamTemplate } from "../../domain/entities/exam-template";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";

export class GetExamTemplateUseCase {
  constructor(private readonly examTemplateRepository: IExamTemplateRepository) {}

  async execute(id: string): Promise<ExamTemplate> {
    const examTemplate = await this.examTemplateRepository.findById(id);
    if (!examTemplate) {
      throw new NotFoundError("Prova não encontrada.");
    }

    return examTemplate;
  }
}
