import "dotenv/config";

import { z } from "zod";

import { createPrismaClient } from "../database/prisma/client";
import { ensureDatabaseUrl } from "../database/prisma/database-url";
import { createApp } from "./create-app";

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  ARTIFACTS_OUTPUT_DIR: z.string().default("output/exam-batches")
});

ensureDatabaseUrl();
const environment = environmentSchema.parse(process.env);

const prismaClient = createPrismaClient();
const app = createApp({
  prismaClient,
  artifactsBaseDir: environment.ARTIFACTS_OUTPUT_DIR
});

const server = app.listen(environment.PORT, () => {
  process.stdout.write(
    `Servidor HTTP iniciado na porta ${environment.PORT}.\n`
  );
});

const shutdown = async (): Promise<void> => {
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
