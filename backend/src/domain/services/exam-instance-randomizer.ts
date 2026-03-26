import { randomUUID } from "node:crypto";

import { AlternativeIdentificationType } from "../entities/alternative-identification-type";
import { ExamInstance, ExamInstanceOption, ExamInstanceQuestion } from "../entities/exam-instance";
import { ExamTemplate } from "../entities/exam-template";

const shuffle = <T>(items: readonly T[]): T[] => {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [
      shuffledItems[randomIndex],
      shuffledItems[index]
    ];
  }

  return shuffledItems;
};

const buildDisplayCode = (
  position: number,
  alternativeIdentificationType: AlternativeIdentificationType
): string => {
  if (alternativeIdentificationType === AlternativeIdentificationType.LETTERS) {
    return String.fromCharCode(64 + position);
  }

  return String(2 ** (position - 1));
};

const buildRandomizedOptions = (
  question: ExamTemplate["questionsSnapshot"][number],
  alternativeIdentificationType: AlternativeIdentificationType
): ExamInstanceOption[] => {
  return shuffle(question.options).map((option, index) => ({
    originalOptionId: option.id,
    position: index + 1,
    description: option.description,
    displayCode: buildDisplayCode(index + 1, alternativeIdentificationType),
    isCorrect: option.isCorrect
  }));
};

const buildRandomizedQuestions = (examTemplate: ExamTemplate): ExamInstanceQuestion[] => {
  return shuffle(examTemplate.questionsSnapshot).map((question, index) => ({
    originalQuestionId: question.id,
    position: index + 1,
    statement: question.statement,
    randomizedOptions: buildRandomizedOptions(
      question,
      examTemplate.alternativeIdentificationType
    )
  }));
};

const buildSignature = (randomizedQuestions: ExamInstanceQuestion[]): string =>
  randomizedQuestions
    .map(
      (question) =>
        `${question.originalQuestionId}:${question.randomizedOptions
          .map((option) => option.originalOptionId)
          .join(">")}`
    )
    .join("|");

export interface RandomizedExamInstanceResult {
  examInstance: ExamInstance;
  signature: string;
}

export interface RandomizedExamInstanceInput {
  batchId: string;
  examCode: string;
  examTemplate: ExamTemplate;
}

export const createRandomizedExamInstance = ({
  batchId,
  examCode,
  examTemplate
}: RandomizedExamInstanceInput): RandomizedExamInstanceResult => {
  const randomizedQuestions = buildRandomizedQuestions(examTemplate);
  const signature = buildSignature(randomizedQuestions);
  const now = new Date();

  return {
    signature,
    examInstance: {
      id: randomUUID(),
      batchId,
      examCode,
      signature,
      templateId: examTemplate.id,
      templateTitle: examTemplate.title,
      alternativeIdentificationType: examTemplate.alternativeIdentificationType,
      randomizedQuestions,
      createdAt: now,
      updatedAt: now
    }
  };
};
