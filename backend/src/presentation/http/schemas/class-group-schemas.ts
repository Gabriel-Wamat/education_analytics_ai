import { z } from "zod";

export const classGroupIdParamSchema = z.object({
  id: z.string().uuid("O ID da turma precisa ser um UUID válido.")
});

export const classGroupBodySchema = z.object({
  topic: z.string().min(1, "O tópico da turma é obrigatório."),
  year: z.coerce.number().int().min(1900).max(2100),
  semester: z.union([z.literal(1), z.literal(2)]),
  studentIds: z.array(z.string().uuid()).optional(),
  goalIds: z.array(z.string().uuid()).optional()
});

export const evaluationBodySchema = z.object({
  studentId: z.string().uuid("O ID do aluno precisa ser um UUID válido."),
  goalId: z.string().uuid("O ID da meta precisa ser um UUID válido."),
  level: z.enum(["MANA", "MPA", "MA"])
});
