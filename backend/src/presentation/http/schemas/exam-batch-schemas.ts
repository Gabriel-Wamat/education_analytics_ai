import { z } from "zod";

export const examBatchIdParamSchema = z.object({
  batchId: z.string().uuid("O ID do lote precisa ser um UUID válido.")
});

export const examArtifactIdParamSchema = z.object({
  artifactId: z
    .string()
    .regex(
      /^(csv--[0-9a-fA-F-]{36}|pdf--[0-9a-fA-F-]{36}--[0-9a-fA-F-]{36})$/,
      "O ID do artefato precisa ser um identificador válido."
    )
});

export const examBatchEmailDispatchBodySchema = z.object({
  classId: z.string().uuid("O ID da turma precisa ser um UUID válido.")
});
