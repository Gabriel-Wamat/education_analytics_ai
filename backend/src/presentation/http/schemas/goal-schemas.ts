import { z } from "zod";

export const goalIdParamSchema = z.object({
  id: z.string().uuid("O ID da meta precisa ser um UUID válido.")
});

export const goalBodySchema = z.object({
  name: z.string().min(1, "O nome da meta é obrigatório."),
  description: z.string().max(500).optional().nullable()
});
