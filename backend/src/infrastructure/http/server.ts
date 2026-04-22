import "dotenv/config";

import path from "node:path";
import { z } from "zod";

import { createPrismaClient } from "../database/prisma/client";
import { ensureDatabaseUrl } from "../database/prisma/database-url";
import { EmailDigestScheduler } from "../services/email-digest-scheduler";
import { SendEvaluationDigestUseCase } from "../../application/use-cases/send-evaluation-digest-use-case";
import { createApp } from "./create-app";

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  ARTIFACTS_OUTPUT_DIR: z.string().default("output/exam-batches"),
  JSON_STORAGE_DIR: z.string().default("data"),
  SMTP_FROM: z.string().optional(),
  EMAIL_DIGEST_INTERVAL_MS: z.coerce.number().int().positive().optional()
});

ensureDatabaseUrl();
const environment = environmentSchema.parse(process.env);

const prismaClient = createPrismaClient();
const app = createApp({
  prismaClient,
  artifactsBaseDir: environment.ARTIFACTS_OUTPUT_DIR,
  jsonStorageDir: path.resolve(process.cwd(), environment.JSON_STORAGE_DIR),
  emailFromAddress: environment.SMTP_FROM
});

const server = app.listen(environment.PORT, () => {
  process.stdout.write(
    `Servidor HTTP iniciado na porta ${environment.PORT}.\n`
  );
});

let scheduler: EmailDigestScheduler | undefined;
if (environment.EMAIL_DIGEST_INTERVAL_MS) {
  const useCase = (app as unknown as {
    sendEvaluationDigestUseCase: SendEvaluationDigestUseCase;
  }).sendEvaluationDigestUseCase;
  scheduler = new EmailDigestScheduler(useCase, {
    intervalMs: environment.EMAIL_DIGEST_INTERVAL_MS,
    fromAddress: environment.SMTP_FROM ?? "no-reply@education-analytics.local",
    onError: (error) => {
      process.stderr.write(
        `[email-digest] Falha ao processar fila: ${(error as Error).message ?? error}\n`
      );
    },
    onSuccess: (result) => {
      if (result.emailsSent > 0 || result.emailsFailed > 0) {
        process.stdout.write(
          `[email-digest] sent=${result.emailsSent} failed=${result.emailsFailed} entries=${result.entriesProcessed}\n`
        );
      }
    }
  });
  scheduler.start();
}

const shutdown = async (): Promise<void> => {
  scheduler?.stop();
  await prismaClient.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});
