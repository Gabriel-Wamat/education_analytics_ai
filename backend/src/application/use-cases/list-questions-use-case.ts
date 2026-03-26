import { Question } from "../../domain/entities/question";
import { IQuestionRepository } from "../../domain/repositories/question-repository";

export class ListQuestionsUseCase {
  constructor(private readonly questionRepository: IQuestionRepository) {}

  async execute(): Promise<Question[]> {
    return this.questionRepository.findAll();
  }
}
