import { z } from "zod";

import { GradingStrategyType } from "../../../domain/entities/grading-strategy-type";

export const gradeExamBodySchema = z.object({
  gradingStrategyType: z.nativeEnum(GradingStrategyType)
});

export const examIdParamSchema = z.object({
  id: z.string().uuid("O identificador da prova deve ser um UUID válido.")
});
