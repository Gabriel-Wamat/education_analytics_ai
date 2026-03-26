import { NotFoundError } from "../errors/not-found-error";
import { Question } from "../../domain/entities/question";
import { IQuestionRepository } from "../../domain/repositories/question-repository";

export class GetQuestionUseCase {
  constructor(private readonly questionRepository: IQuestionRepository) {}

  async execute(id: string): Promise<Question> {
    const question = await this.questionRepository.findById(id);
    if (!question) {
      throw new NotFoundError("Questão não encontrada.");
    }

    return question;
  }
}
