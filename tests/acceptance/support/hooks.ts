import { AfterAll, Before, BeforeAll, setDefaultTimeout } from "@cucumber/cucumber";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

import { createPrismaClient } from "../../../backend/src/infrastructure/database/prisma/client";
import { createApp } from "../../../backend/src/infrastructure/http/create-app";
import { InMemoryEmailService } from "../../../backend/src/infrastructure/services/in-memory-email-service";
import { FakeLLMProviderService } from "./fake-llm-provider";
import { setupTestDatabase } from "./setup-test-database";
import { TestClock, getTestContext, setTestContext } from "./test-context";
import { AcceptanceWorld } from "./world";

const fakeLLMProviderService = new FakeLLMProviderService();
const inMemoryEmailService = new InMemoryEmailService();
const testClock = new TestClock();
let jsonStorageDir: string;

setDefaultTimeout(30_000);

BeforeAll(async () => {
  await setupTestDatabase();

  const prismaClient = createPrismaClient();
  await prismaClient.$connect();

  jsonStorageDir = path.join(
    os.tmpdir(),
    `ea-cucumber-json-${crypto.randomBytes(6).toString("hex")}`
  );
  await fs.mkdir(jsonStorageDir, { recursive: true });

  setTestContext({
    app: createApp({
      prismaClient,
      llmProviderService: fakeLLMProviderService,
      emailService: inMemoryEmailService,
      clock: testClock,
      jsonStorageDir
    }),
    prismaClient,
    llmProviderService: fakeLLMProviderService,
    emailService: inMemoryEmailService,
    clock: testClock,
    jsonStorageDir
  });
});

Before(async function (this: AcceptanceWorld) {
  this.reset();

  const { prismaClient, jsonStorageDir: ctxDir } = getTestContext();
  fakeLLMProviderService.reset();
  inMemoryEmailService.reset();
  testClock.set(new Date("2026-04-22T12:00:00.000Z"));
  await prismaClient.examArtifact.deleteMany();
  await prismaClient.examBatch.deleteMany();
  await prismaClient.examReport.deleteMany();
  await prismaClient.examInstance.deleteMany();
  await prismaClient.examTemplate.deleteMany();
  await prismaClient.option.deleteMany();
  await prismaClient.question.deleteMany();

  await fs.rm(path.resolve(process.cwd(), "output/exam-batches"), {
    force: true,
    recursive: true
  });

  await fs.rm(ctxDir, { force: true, recursive: true });
  await fs.mkdir(ctxDir, { recursive: true });
});

AfterAll(async () => {
  const { prismaClient, jsonStorageDir: ctxDir } = getTestContext();
  await prismaClient.$disconnect();
  await fs.rm(ctxDir, { force: true, recursive: true });
});
