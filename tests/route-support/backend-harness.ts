import fs from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { Express } from "express";

import { createPrismaClient } from "../../backend/src/infrastructure/database/prisma/client";
import { createApp } from "../../backend/src/infrastructure/http/create-app";
import { FakeLLMProviderService } from "../acceptance/support/fake-llm-provider";
import { setupTestDatabase } from "../acceptance/support/setup-test-database";

export interface BackendTestHarness {
  app: Express;
  prismaClient: PrismaClient;
  llmProviderService: FakeLLMProviderService;
  artifactsBaseDir: string;
  reset: () => Promise<void>;
  close: () => Promise<void>;
}

export const createBackendTestHarness = async (): Promise<BackendTestHarness> => {
  await setupTestDatabase();

  const prismaClient = createPrismaClient();
  await prismaClient.$connect();

  const llmProviderService = new FakeLLMProviderService();
  const artifactsBaseDir = path.resolve(process.cwd(), "output/exam-batches-test");
  const app = createApp({
    prismaClient,
    llmProviderService,
    artifactsBaseDir
  });

  const reset = async (): Promise<void> => {
    llmProviderService.reset();
    await prismaClient.examReport.deleteMany();
    await prismaClient.examInstance.deleteMany();
    await prismaClient.examTemplate.deleteMany();
    await prismaClient.option.deleteMany();
    await prismaClient.question.deleteMany();
    await fs.rm(artifactsBaseDir, {
      force: true,
      recursive: true
    });
  };

  const close = async (): Promise<void> => {
    await prismaClient.$disconnect();
  };

  return {
    app,
    prismaClient,
    llmProviderService,
    artifactsBaseDir,
    reset,
    close
  };
};

const parseCsv = (content: string): string[][] =>
  content
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(","));

export const buildStudentResponsesCsvFromAnswerKey = (
  answerKeyCsv: string,
  studentPrefix = "ALUNO"
): string => {
  const [header, ...rows] = parseCsv(answerKeyCsv);
  const expectedHeader = [
    "examCode",
    "questionPosition",
    "questionId",
    "alternativeIdentificationType",
    "correctDisplayAnswer",
    "correctOptionPositions"
  ];

  if (header.join(",") !== expectedHeader.join(",")) {
    throw new Error("Cabeçalho inesperado no CSV de gabarito.");
  }

  const outputRows = [["studentId", "studentName", "examCode", "questionPosition", "markedAnswer"]];
  const examCodeIndex = new Map<string, number>();

  for (const row of rows) {
    const [examCode, questionPosition, , , correctDisplayAnswer] = row;
    const studentNumber = examCodeIndex.get(examCode) ?? examCodeIndex.size + 1;

    examCodeIndex.set(examCode, studentNumber);
    outputRows.push([
      `${studentPrefix}-${studentNumber}`,
      `Aluno ${studentNumber}`,
      examCode,
      questionPosition,
      correctDisplayAnswer
    ]);
  }

  return outputRows.map((row) => row.join(",")).join("\n");
};

export const createQuestionPayload = (suffix: string) => ({
  topic: `Tema ${suffix}`,
  unit: 1,
  statement: `Questão ${suffix}`,
  options: [
    { description: `Alternativa A ${suffix}`, isCorrect: true },
    { description: `Alternativa B ${suffix}`, isCorrect: false },
    { description: `Alternativa C ${suffix}`, isCorrect: true }
  ]
});
