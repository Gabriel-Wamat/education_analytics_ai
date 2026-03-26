import { randomUUID } from "node:crypto";

import { QuestionInput } from "../dto/question-input";
import { NotFoundError } from "../errors/not-found-error";
import { validateQuestionInput } from "../validators/question-validator";
import { Question } from "../../domain/entities/question";
import { IQuestionRepository } from "../../domain/repositories/question-repository";

export class UpdateQuestionUseCase {
  constructor(private readonly questionRepository: IQuestionRepository) {}

  async execute(id: string, input: QuestionInput): Promise<Question> {
    validateQuestionInput(input);

    const existingQuestion = await this.questionRepository.findById(id);
    if (!existingQuestion) {
      throw new NotFoundError("Questão não encontrada.");
    }

    const updatedQuestion: Question = {
      id: existingQuestion.id,
      topic: input.topic.trim(),
      unit: input.unit,
      statement: input.statement.trim(),
      options: input.options.map((option) => ({
        id: randomUUID(),
        description: option.description.trim(),
        isCorrect: option.isCorrect
      })),
      createdAt: existingQuestion.createdAt,
      updatedAt: new Date()
    };

    return this.questionRepository.update(updatedQuestion);
  }
}
