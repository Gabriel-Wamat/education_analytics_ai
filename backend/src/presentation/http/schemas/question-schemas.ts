import { z } from "zod";

export const questionIdParamSchema = z.object({
  id: z.string().uuid("O ID da questão precisa ser um UUID válido.")
});

export const questionBodySchema = z.object({
  topic: z.string().trim().min(1, "O tema da questão é obrigatório."),
  unit: z.coerce.number().int().min(1, "A questão deve pertencer a uma unidade válida."),
  statement: z.string().trim().min(1, "O enunciado da questão é obrigatório."),
  options: z
    .array(
      z.object({
        description: z.string().trim().min(1, "A descrição da alternativa é obrigatória."),
        isCorrect: z.boolean()
      })
    )
    .min(2, "A questão deve ter pelo menos duas alternativas.")
});
