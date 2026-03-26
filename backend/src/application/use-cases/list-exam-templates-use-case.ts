import { ExamTemplate } from "../../domain/entities/exam-template";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";

export class ListExamTemplatesUseCase {
  constructor(private readonly examTemplateRepository: IExamTemplateRepository) {}

  async execute(): Promise<ExamTemplate[]> {
    return this.examTemplateRepository.findAll();
  }
}
