import { Question } from "@/types/api";

export const DEFAULT_QUESTION_UNITS = [1, 2, 3];

export const formatQuestionUnit = (unit: number): string => `Unidade ${unit}`;

export const buildQuestionUnits = (
  questions: Question[],
  extraUnits: number[] = []
): number[] =>
  Array.from(
    new Set(
      [...DEFAULT_QUESTION_UNITS, ...extraUnits, ...questions.map((question) => question.unit)].filter(
        (unit) => Number.isInteger(unit) && unit >= 1
      )
    )
  ).sort((left, right) => left - right);

export const buildQuestionTopics = (questions: Question[]): string[] =>
  Array.from(
    new Set(
      questions
        .map((question) => question.topic.trim())
        .filter((topic) => topic.length > 0)
    )
  ).sort((left, right) => left.localeCompare(right, "pt-BR"));

export const matchesQuestionSearch = (question: Question, rawSearch: string): boolean => {
  const search = rawSearch.trim().toLowerCase();

  if (search.length === 0) {
    return true;
  }

  return [
    question.statement,
    question.topic,
    formatQuestionUnit(question.unit),
    `u${question.unit}`
  ].some((value) => value.toLowerCase().includes(search));
};
