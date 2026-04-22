import { PrismaClient } from "@prisma/client";
import { Express } from "express";
import { ILLMProviderService } from "../../../backend/src/application/services/llm-provider-service";
import { InMemoryEmailService } from "../../../backend/src/infrastructure/services/in-memory-email-service";
import { IClock } from "../../../backend/src/application/services/clock";

export class TestClock implements IClock {
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

interface TestContextState {
  app?: Express;
  prismaClient?: PrismaClient;
  llmProviderService?: ILLMProviderService;
  emailService?: InMemoryEmailService;
  clock?: TestClock;
  jsonStorageDir?: string;
}

const state: TestContextState = {};

export const setTestContext = (context: TestContextState): void => {
  state.app = context.app;
  state.prismaClient = context.prismaClient;
  state.llmProviderService = context.llmProviderService;
  state.emailService = context.emailService;
  state.clock = context.clock;
  state.jsonStorageDir = context.jsonStorageDir;
};

export const getTestContext = (): Required<TestContextState> => {
  if (
    !state.app ||
    !state.prismaClient ||
    !state.llmProviderService ||
    !state.emailService ||
    !state.clock ||
    !state.jsonStorageDir
  ) {
    throw new Error("O contexto de testes ainda não foi inicializado.");
  }

  return {
    app: state.app,
    prismaClient: state.prismaClient,
    llmProviderService: state.llmProviderService,
    emailService: state.emailService,
    clock: state.clock,
    jsonStorageDir: state.jsonStorageDir
  };
};
