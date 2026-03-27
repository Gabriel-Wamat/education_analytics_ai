import { ExamTemplateInput } from "../dto/exam-template-input";
import { NotFoundError } from "../errors/not-found-error";
import { validateExamTemplateInput } from "../validators/exam-template-validator";
import { ExamHeaderMetadata } from "../../domain/entities/exam-header-metadata";
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

const normalizeHeaderMetadata = (headerMetadata: ExamHeaderMetadata): ExamHeaderMetadata => ({
  discipline: headerMetadata.discipline.trim(),
  teacher: headerMetadata.teacher.trim(),
  examDate: headerMetadata.examDate.trim()
});

export class UpdateExamTemplateUseCase {
  constructor(
    private readonly examTemplateRepository: IExamTemplateRepository,
    private readonly questionRepository: IQuestionRepository
  ) {}

  async execute(id: string, input: ExamTemplateInput): Promise<ExamTemplate> {
    validateExamTemplateInput(input);

    const existingExamTemplate = await this.examTemplateRepository.findById(id);
    if (!existingExamTemplate) {
      throw new NotFoundError("Prova não encontrada.");
    }

    const existingQuestions = await this.questionRepository.findByIds(input.questionIds);
    const questionsById = new Map(existingQuestions.map((question) => [question.id, question]));

    const missingIds = input.questionIds.filter((questionId) => !questionsById.has(questionId));
    if (missingIds.length > 0) {
      throw new NotFoundError("Uma ou mais questões informadas não foram encontradas.", missingIds);
    }

    const updatedExamTemplate: ExamTemplate = {
      id: existingExamTemplate.id,
      title: input.title.trim(),
      headerMetadata: normalizeHeaderMetadata(input.headerMetadata),
      questionsSnapshot: input.questionIds.map((questionId) =>
        cloneQuestion(questionsById.get(questionId)!)
      ),
      alternativeIdentificationType: input.alternativeIdentificationType,
      createdAt: existingExamTemplate.createdAt,
      updatedAt: new Date()
    };

    return this.examTemplateRepository.update(updatedExamTemplate);
  }
}
