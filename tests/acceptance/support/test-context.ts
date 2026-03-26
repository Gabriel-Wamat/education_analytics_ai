import { PrismaClient } from "@prisma/client";
import { Express } from "express";
import { ILLMProviderService } from "../../../backend/src/application/services/llm-provider-service";

interface TestContextState {
  app?: Express;
  prismaClient?: PrismaClient;
  llmProviderService?: ILLMProviderService;
}

const state: TestContextState = {};

export const setTestContext = (context: TestContextState): void => {
  state.app = context.app;
  state.prismaClient = context.prismaClient;
  state.llmProviderService = context.llmProviderService;
};

export const getTestContext = (): Required<TestContextState> => {
  if (!state.app || !state.prismaClient || !state.llmProviderService) {
    throw new Error("O contexto de testes ainda não foi inicializado.");
  }

  return {
    app: state.app,
    prismaClient: state.prismaClient,
    llmProviderService: state.llmProviderService
  };
};
