import { QuestionInput } from "../dto/question-input";
import { ValidationError } from "../errors/validation-error";

export const validateQuestionInput = (input: QuestionInput): void => {
  const errors: string[] = [];

  if (input.topic.trim().length === 0) {
    errors.push("O tema da questão é obrigatório.");
  }

  if (!Number.isInteger(input.unit) || input.unit < 1) {
    errors.push("A questão deve pertencer a uma unidade válida.");
  }

  if (input.statement.trim().length === 0) {
    errors.push("O enunciado da questão é obrigatório.");
  }

  if (input.options.length < 2) {
    errors.push("A questão deve ter pelo menos duas alternativas.");
  }

  if (input.options.some((option) => option.description.trim().length === 0)) {
    errors.push("Todas as alternativas devem possuir descrição.");
  }

  if (!input.options.some((option) => option.isCorrect)) {
    errors.push("A questão deve ter pelo menos uma alternativa correta.");
  }

  if (errors.length > 0) {
    throw new ValidationError("Falha na validação da questão.", errors);
  }
};
