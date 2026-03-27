import { AlternativeIdentificationType } from "../entities/alternative-identification-type";
import { ExamInstanceQuestion } from "../entities/exam-instance";

const buildEmptyStates = (question: ExamInstanceQuestion): boolean[] =>
  question.randomizedOptions.map(() => false);

export const normalizeMarkedAnswer = (
  markedAnswer: string,
  question: ExamInstanceQuestion,
  alternativeIdentificationType: AlternativeIdentificationType
): boolean[] => {
  const normalizedAnswer = markedAnswer.trim();
  if (normalizedAnswer.length === 0) {
    return buildEmptyStates(question);
  }

  if (alternativeIdentificationType === AlternativeIdentificationType.LETTERS) {
    const markedCodes = new Set(
      normalizedAnswer
        .split("|")
        .map((value) => value.trim().toUpperCase())
        .filter((value) => value.length > 0)
    );
    const availableCodes = new Set(
      question.randomizedOptions.map((option) => option.displayCode.toUpperCase())
    );
    const invalidCodes = [...markedCodes].filter((value) => !availableCodes.has(value));

    if (invalidCodes.length > 0) {
      throw new Error(`Resposta invalida para letras: ${invalidCodes.join("|")}`);
    }

    return question.randomizedOptions.map((option) =>
      markedCodes.has(option.displayCode.toUpperCase())
    );
  }

  const parsedValue = Number(normalizedAnswer);
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`Resposta inválida para potências de 2: ${markedAnswer}`);
  }

  const supportedMask = question.randomizedOptions.reduce(
    (total, option) => total | Number(option.displayCode),
    0
  );
  if ((parsedValue & ~supportedMask) !== 0) {
    throw new Error(`Resposta inválida para potências de 2: ${markedAnswer}`);
  }

  return question.randomizedOptions.map((option) => {
    const optionValue = Number(option.displayCode);
    return (parsedValue & optionValue) === optionValue;
  });
};

export const buildExpectedStates = (question: ExamInstanceQuestion): boolean[] =>
  question.randomizedOptions.map((option) => option.isCorrect);

export const buildDisplayAnswer = (
  states: boolean[],
  question: ExamInstanceQuestion,
  alternativeIdentificationType: AlternativeIdentificationType
): string => {
  const selectedOptions = question.randomizedOptions.filter((_, index) => states[index]);
  if (selectedOptions.length === 0) {
    return "";
  }

  if (alternativeIdentificationType === AlternativeIdentificationType.LETTERS) {
    return selectedOptions.map((option) => option.displayCode).join("|");
  }

  return String(
    selectedOptions.reduce((total, option) => total + Number(option.displayCode), 0)
  );
};

export const buildCorrectOptionPositions = (question: ExamInstanceQuestion): string =>
  question.randomizedOptions
    .filter((option) => option.isCorrect)
    .map((option) => String(option.position))
    .join("|");
