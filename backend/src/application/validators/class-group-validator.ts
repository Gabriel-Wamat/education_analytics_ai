import { ClassGroupInput } from "../dto/class-group-input";
import { ValidationError } from "../errors/validation-error";

export interface NormalizedClassGroupInput {
  topic: string;
  year: number;
  semester: 1 | 2;
  studentIds: string[];
  goalIds: string[];
}

const dedupe = <T>(values: T[]): T[] => Array.from(new Set(values));

export const validateClassGroupInput = (
  input: ClassGroupInput
): NormalizedClassGroupInput => {
  const errors: string[] = [];

  const topic = (input.topic ?? "").trim();
  if (topic.length === 0) {
    errors.push("O tópico da turma é obrigatório.");
  } else if (topic.length > 200) {
    errors.push("O tópico da turma deve ter no máximo 200 caracteres.");
  }

  const year = Number(input.year);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    errors.push("O ano da turma deve ser um inteiro entre 1900 e 2100.");
  }

  const semesterRaw = Number(input.semester);
  const semester = semesterRaw === 1 ? 1 : semesterRaw === 2 ? 2 : null;
  if (semester === null) {
    errors.push("O semestre da turma deve ser 1 ou 2.");
  }

  const studentIds = dedupe(Array.isArray(input.studentIds) ? input.studentIds : []);
  const goalIds = dedupe(Array.isArray(input.goalIds) ? input.goalIds : []);

  if (errors.length > 0) {
    throw new ValidationError("Falha na validação da turma.", errors);
  }

  return {
    topic,
    year,
    semester: semester as 1 | 2,
    studentIds,
    goalIds
  };
};
