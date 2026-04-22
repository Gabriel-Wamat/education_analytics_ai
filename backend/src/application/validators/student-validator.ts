import { isValidCpf, sanitizeCpf } from "../../domain/services/cpf-validator";
import { StudentInput } from "../dto/student-input";
import { ValidationError } from "../errors/validation-error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface NormalizedStudentInput {
  name: string;
  cpf: string;
  email: string;
}

export const validateStudentInput = (input: StudentInput): NormalizedStudentInput => {
  const errors: string[] = [];

  const name = (input.name ?? "").trim();
  if (name.length === 0) {
    errors.push("O nome do aluno é obrigatório.");
  } else if (name.length > 200) {
    errors.push("O nome do aluno deve ter no máximo 200 caracteres.");
  }

  const cpfDigits = sanitizeCpf(input.cpf ?? "");
  if (cpfDigits.length === 0) {
    errors.push("O CPF do aluno é obrigatório.");
  } else if (!isValidCpf(cpfDigits)) {
    errors.push("CPF inválido.");
  }

  const email = (input.email ?? "").trim().toLowerCase();
  if (email.length === 0) {
    errors.push("O email do aluno é obrigatório.");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("Email inválido.");
  } else if (email.length > 254) {
    errors.push("O email deve ter no máximo 254 caracteres.");
  }

  if (errors.length > 0) {
    throw new ValidationError("Dados do aluno inválidos.", errors);
  }

  return { name, cpf: cpfDigits, email };
};
