import { randomUUID } from "node:crypto";

import { QuestionInput } from "../dto/question-input";
import { validateQuestionInput } from "../validators/question-validator";
import { Question } from "../../domain/entities/question";
import { IQuestionRepository } from "../../domain/repositories/question-repository";

export class CreateQuestionUseCase {
  constructor(private readonly questionRepository: IQuestionRepository) {}

  async execute(input: QuestionInput): Promise<Question> {
    validateQuestionInput(input);

    const now = new Date();
    const question: Question = {
      id: randomUUID(),
      topic: input.topic.trim(),
      unit: input.unit,
      statement: input.statement.trim(),
      options: input.options.map((option) => ({
        id: randomUUID(),
        description: option.description.trim(),
        isCorrect: option.isCorrect
      })),
      createdAt: now,
      updatedAt: now
    };

    return this.questionRepository.create(question);
  }
}
