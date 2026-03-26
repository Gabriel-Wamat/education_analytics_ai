import { AfterAll, Before, BeforeAll, setDefaultTimeout } from "@cucumber/cucumber";
import fs from "node:fs/promises";
import path from "node:path";

import { createPrismaClient } from "../../../backend/src/infrastructure/database/prisma/client";
import { createApp } from "../../../backend/src/infrastructure/http/create-app";
import { FakeLLMProviderService } from "./fake-llm-provider";
import { setupTestDatabase } from "./setup-test-database";
import { getTestContext, setTestContext } from "./test-context";
import { AcceptanceWorld } from "./world";

const fakeLLMProviderService = new FakeLLMProviderService();

setDefaultTimeout(30_000);

BeforeAll(async () => {
  await setupTestDatabase();

  const prismaClient = createPrismaClient();
  await prismaClient.$connect();

  setTestContext({
    app: createApp({ prismaClient, llmProviderService: fakeLLMProviderService }),
    prismaClient,
    llmProviderService: fakeLLMProviderService
  });
});

Before(async function (this: AcceptanceWorld) {
  this.reset();

  const { prismaClient } = getTestContext();
  fakeLLMProviderService.reset();
  await prismaClient.examReport.deleteMany();
  await prismaClient.examInstance.deleteMany();
  await prismaClient.examTemplate.deleteMany();
  await prismaClient.option.deleteMany();
  await prismaClient.question.deleteMany();

  await fs.rm(path.resolve(process.cwd(), "output/exam-batches"), {
    force: true,
    recursive: true
  });
});

AfterAll(async () => {
  const { prismaClient } = getTestContext();
  await prismaClient.$disconnect();
});
