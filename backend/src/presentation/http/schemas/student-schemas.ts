import { z } from "zod";

export const studentIdParamSchema = z.object({
  id: z.string().uuid("O ID do aluno precisa ser um UUID válido.")
});

export const studentBodySchema = z.object({
  name: z.string().min(1, "O nome do aluno é obrigatório."),
  cpf: z.string().min(1, "O CPF do aluno é obrigatório."),
  email: z.string().min(1, "O email do aluno é obrigatório.")
});
