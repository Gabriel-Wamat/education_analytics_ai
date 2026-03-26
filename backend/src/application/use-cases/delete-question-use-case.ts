import { NotFoundError } from "../errors/not-found-error";
import { IQuestionRepository } from "../../domain/repositories/question-repository";

export class DeleteQuestionUseCase {
  constructor(private readonly questionRepository: IQuestionRepository) {}

  async execute(id: string): Promise<void> {
    const existingQuestion = await this.questionRepository.findById(id);
    if (!existingQuestion) {
      throw new NotFoundError("Questão não encontrada.");
    }

    await this.questionRepository.delete(id);
  }
}
