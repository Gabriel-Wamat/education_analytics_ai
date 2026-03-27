import { ExamTemplateInput } from "../dto/exam-template-input";
import { ValidationError } from "../errors/validation-error";

export const validateExamTemplateInput = (input: ExamTemplateInput): void => {
  const errors: string[] = [];

  if (input.title.trim().length === 0) {
    errors.push("O título da prova é obrigatório.");
  }

  if (input.headerMetadata.discipline.trim().length === 0) {
    errors.push("A disciplina da prova é obrigatória.");
  }

  if (input.headerMetadata.teacher.trim().length === 0) {
    errors.push("O professor da prova é obrigatório.");
  }

  if (input.headerMetadata.examDate.trim().length === 0) {
    errors.push("A data da prova é obrigatória.");
  }

  if (input.questionIds.length === 0) {
    errors.push("A prova deve conter pelo menos uma questão.");
  }

  const uniqueIds = new Set(input.questionIds);
  if (uniqueIds.size !== input.questionIds.length) {
    errors.push("A lista de questões da prova não pode conter IDs duplicados.");
  }

  if (errors.length > 0) {
    throw new ValidationError("Falha na validação da prova.", errors);
  }
};
