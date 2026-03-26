import { randomUUID } from "node:crypto";

import { ExamTemplateInput } from "../dto/exam-template-input";
import { NotFoundError } from "../errors/not-found-error";
import { validateExamTemplateInput } from "../validators/exam-template-validator";
import { ExamTemplate } from "../../domain/entities/exam-template";
import { Question } from "../../domain/entities/question";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";
import { IQuestionRepository } from "../../domain/repositories/question-repository";

const cloneQuestion = (question: Question): Question => ({
  ...question,
  createdAt: new Date(question.createdAt),
  updatedAt: new Date(question.updatedAt),
  options: question.options.map((option) => ({ ...option }))
});

export class CreateExamTemplateUseCase {
  constructor(
    private readonly examTemplateRepository: IExamTemplateRepository,
    private readonly questionRepository: IQuestionRepository
  ) {}

  async execute(input: ExamTemplateInput): Promise<ExamTemplate> {
    validateExamTemplateInput(input);

    const existingQuestions = await this.questionRepository.findByIds(input.questionIds);
    const questionsById = new Map(existingQuestions.map((question) => [question.id, question]));

    const missingIds = input.questionIds.filter((questionId) => !questionsById.has(questionId));
    if (missingIds.length > 0) {
      throw new NotFoundError("Uma ou mais questões informadas não foram encontradas.", missingIds);
    }

    const now = new Date();
    const examTemplate: ExamTemplate = {
      id: randomUUID(),
      title: input.title.trim(),
      questionsSnapshot: input.questionIds.map((questionId) =>
        cloneQuestion(questionsById.get(questionId)!)
      ),
      alternativeIdentificationType: input.alternativeIdentificationType,
      createdAt: now,
      updatedAt: now
    };

    return this.examTemplateRepository.create(examTemplate);
  }
}
