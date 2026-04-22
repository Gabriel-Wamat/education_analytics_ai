import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { Express } from "express";

import { createPrismaClient } from "../../backend/src/infrastructure/database/prisma/client";
import { createApp } from "../../backend/src/infrastructure/http/create-app";
import { InMemoryEmailService } from "../../backend/src/infrastructure/services/in-memory-email-service";
import { IClock } from "../../backend/src/application/services/clock";
import { FakeLLMProviderService } from "../acceptance/support/fake-llm-provider";
import { setupTestDatabase } from "../acceptance/support/setup-test-database";

export class FixedClock implements IClock {
  constructor(private current: Date = new Date("2026-04-22T12:00:00.000Z")) {}
  now(): Date {
    return new Date(this.current);
  }
  set(value: Date): void {
    this.current = value;
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export interface BackendTestHarness {
  app: Express;
  prismaClient: PrismaClient;
  llmProviderService: FakeLLMProviderService;
  emailService: InMemoryEmailService;
  clock: FixedClock;
  artifactsBaseDir: string;
  jsonStorageDir: string;
  reset: () => Promise<void>;
  close: () => Promise<void>;
}

export const createBackendTestHarness = async (): Promise<BackendTestHarness> => {
  await setupTestDatabase();

  const prismaClient = createPrismaClient();
  await prismaClient.$connect();

  const llmProviderService = new FakeLLMProviderService();
  const emailService = new InMemoryEmailService();
  const clock = new FixedClock();
  const artifactsBaseDir = path.resolve(process.cwd(), "output/exam-batches-test");
  const jsonStorageDir = path.join(
    os.tmpdir(),
    `ea-test-json-${crypto.randomBytes(6).toString("hex")}`
  );
  await fs.mkdir(jsonStorageDir, { recursive: true });

  const app = createApp({
    prismaClient,
    llmProviderService,
    artifactsBaseDir,
    emailService,
    clock,
    jsonStorageDir
  });

  const reset = async (): Promise<void> => {
    llmProviderService.reset();
    emailService.reset();
    clock.set(new Date("2026-04-22T12:00:00.000Z"));
    await prismaClient.examArtifact.deleteMany();
    await prismaClient.examBatch.deleteMany();
    await prismaClient.examReport.deleteMany();
    await prismaClient.examInstance.deleteMany();
    await prismaClient.examTemplate.deleteMany();
    await prismaClient.option.deleteMany();
    await prismaClient.question.deleteMany();
    await fs.rm(artifactsBaseDir, { force: true, recursive: true });
    await fs.rm(jsonStorageDir, { force: true, recursive: true });
    await fs.mkdir(jsonStorageDir, { recursive: true });
  };

  const close = async (): Promise<void> => {
    await prismaClient.$disconnect();
    await fs.rm(jsonStorageDir, { force: true, recursive: true });
  };

  return {
    app,
    prismaClient,
    llmProviderService,
    emailService,
    clock,
    artifactsBaseDir,
    jsonStorageDir,
    reset,
    close
  };
};

const parseCsv = (content: string): string[][] =>
  content
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(","));

export const createExamTemplatePayload = (
  questionIds: string[],
  overrides?: Partial<{
    title: string;
    alternativeIdentificationType: "LETTERS" | "POWERS_OF_2";
    discipline: string;
    teacher: string;
    examDate: string;
  }>
) => ({
  title: overrides?.title ?? "Prova Base",
  questionIds,
  alternativeIdentificationType: overrides?.alternativeIdentificationType ?? "LETTERS",
  headerMetadata: {
    discipline: overrides?.discipline ?? "Matemática",
    teacher: overrides?.teacher ?? "Prof. Ada Lovelace",
    examDate: overrides?.examDate ?? "2026-04-10"
  }
});

export const buildStudentResponsesCsvFromAnswerKey = (
  answerKeyCsv: string,
  studentPrefix = "ALUNO"
): string => {
  const [header, ...rows] = parseCsv(answerKeyCsv);
  if (header[0] !== "examCode" || header.length < 2) {
    throw new Error("Cabeçalho inesperado no CSV de gabarito.");
  }

  const questionHeaders = header.slice(1);
  if (!questionHeaders.every((column, index) => column === `q${index + 1}`)) {
    throw new Error("O CSV de gabarito não está no formato largo esperado.");
  }

  const outputRows = [["studentId", "studentName", "examCode", ...questionHeaders]];
  const examCodeIndex = new Map<string, number>();

  for (const row of rows) {
    const [examCode, ...answers] = row;
    const studentNumber = examCodeIndex.get(examCode) ?? examCodeIndex.size + 1;

    examCodeIndex.set(examCode, studentNumber);
    outputRows.push([
      `${studentPrefix}-${studentNumber}`,
      `Aluno ${studentNumber}`,
      examCode,
      ...answers
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
