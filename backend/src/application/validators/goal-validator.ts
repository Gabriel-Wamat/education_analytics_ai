import { GoalInput } from "../dto/goal-input";
import { ValidationError } from "../errors/validation-error";

export interface NormalizedGoalInput {
  name: string;
  description?: string;
}

export const validateGoalInput = (input: GoalInput): NormalizedGoalInput => {
  const errors: string[] = [];

  const name = (input.name ?? "").trim();
  if (name.length === 0) {
    errors.push("O nome da meta é obrigatório.");
  } else if (name.length > 120) {
    errors.push("O nome da meta deve ter no máximo 120 caracteres.");
  }

  let description: string | undefined;
  if (input.description !== undefined && input.description !== null) {
    const trimmed = String(input.description).trim();
    if (trimmed.length > 500) {
      errors.push("A descrição da meta deve ter no máximo 500 caracteres.");
    }
    description = trimmed.length > 0 ? trimmed : undefined;
  }

  if (errors.length > 0) {
    throw new ValidationError("Falha na validação da meta.", errors);
  }

  return { name, description };
};
