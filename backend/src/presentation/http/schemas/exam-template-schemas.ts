import { z } from "zod";

import { AlternativeIdentificationType } from "../../../domain/entities/alternative-identification-type";

export const examTemplateIdParamSchema = z.object({
  id: z.string().uuid("O ID da prova precisa ser um UUID válido.")
});

export const examTemplateBodySchema = z.object({
  title: z.string().trim().min(1, "O título da prova é obrigatório."),
  headerMetadata: z.object({
    discipline: z.string().trim().min(1, "A disciplina da prova é obrigatória."),
    teacher: z.string().trim().min(1, "O professor da prova é obrigatório."),
    examDate: z.string().trim().min(1, "A data da prova é obrigatória.")
  }),
  questionIds: z
    .array(z.string().uuid("Os IDs das questões devem ser UUIDs válidos."))
    .min(1, "A prova deve conter pelo menos uma questão."),
  alternativeIdentificationType: z.nativeEnum(AlternativeIdentificationType)
});

export const generateExamInstancesBodySchema = z.object({
  quantity: z.coerce.number().int().positive("A quantidade deve ser um inteiro positivo.")
});
