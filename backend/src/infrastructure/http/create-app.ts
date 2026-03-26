import path from "node:path";

import express, { Express } from "express";
import { PrismaClient } from "@prisma/client";

import { GenerateClassInsightsUseCase } from "../../application/use-cases/generate-class-insights-use-case";
import { GradeExamsUseCase } from "../../application/use-cases/grade-exams-use-case";
import { CreateExamTemplateUseCase } from "../../application/use-cases/create-exam-template-use-case";
import { CreateQuestionUseCase } from "../../application/use-cases/create-question-use-case";
import { DeleteExamTemplateUseCase } from "../../application/use-cases/delete-exam-template-use-case";
import { DeleteQuestionUseCase } from "../../application/use-cases/delete-question-use-case";
import { GenerateExamInstancesUseCase } from "../../application/use-cases/generate-exam-instances-use-case";
import { GetDashboardMetricsUseCase } from "../../application/use-cases/get-dashboard-metrics-use-case";
import { GetExamTemplateUseCase } from "../../application/use-cases/get-exam-template-use-case";
import { GetQuestionUseCase } from "../../application/use-cases/get-question-use-case";
import { ListExamTemplatesUseCase } from "../../application/use-cases/list-exam-templates-use-case";
import { ListQuestionsUseCase } from "../../application/use-cases/list-questions-use-case";
import { UpdateExamTemplateUseCase } from "../../application/use-cases/update-exam-template-use-case";
import { UpdateQuestionUseCase } from "../../application/use-cases/update-question-use-case";
import { ILLMProviderService } from "../../application/services/llm-provider-service";
import { createPrismaClient } from "../database/prisma/client";
import { PrismaExamInstanceRepository } from "../repositories/prisma-exam-instance-repository";
import { PrismaExamReportRepository } from "../repositories/prisma-exam-report-repository";
import { PrismaExamTemplateRepository } from "../repositories/prisma-exam-template-repository";
import { PrismaQuestionRepository } from "../repositories/prisma-question-repository";
import { CsvFileService } from "../services/csv-file-service";
import { OpenAIProviderService } from "../services/openai-provider-service";
import { PdfKitPdfGeneratorService } from "../services/pdfkit-pdf-generator-service";
import { ExamController } from "../../presentation/http/controllers/exam-controller";
import { ExamTemplateController } from "../../presentation/http/controllers/exam-template-controller";
import { QuestionController } from "../../presentation/http/controllers/question-controller";
import { errorHandler } from "../../presentation/http/middlewares/error-handler";
import { createExamRouter } from "../../presentation/http/routes/exam-routes";
import { createExamTemplateRouter } from "../../presentation/http/routes/exam-template-routes";
import { createQuestionRouter } from "../../presentation/http/routes/question-routes";

export interface AppDependencies {
  prismaClient?: PrismaClient;
  artifactsBaseDir?: string;
  llmProviderService?: ILLMProviderService;
}

export const createApp = (dependencies: AppDependencies = {}): Express => {
  const prismaClient = dependencies.prismaClient ?? createPrismaClient();
  const artifactsBaseDir =
    dependencies.artifactsBaseDir ?? path.resolve(process.cwd(), "output/exam-batches");

  const questionRepository = new PrismaQuestionRepository(prismaClient);
  const examTemplateRepository = new PrismaExamTemplateRepository(prismaClient);
  const examInstanceRepository = new PrismaExamInstanceRepository(prismaClient);
  const examReportRepository = new PrismaExamReportRepository(prismaClient);
  const csvService = new CsvFileService();
  const pdfGeneratorService = new PdfKitPdfGeneratorService();
  const llmProviderService =
    dependencies.llmProviderService ?? new OpenAIProviderService();
  const getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(
    examReportRepository,
    examTemplateRepository
  );

  const questionController = new QuestionController(
    new CreateQuestionUseCase(questionRepository),
    new GetQuestionUseCase(questionRepository),
    new ListQuestionsUseCase(questionRepository),
    new UpdateQuestionUseCase(questionRepository),
    new DeleteQuestionUseCase(questionRepository)
  );

  const examTemplateController = new ExamTemplateController(
    new CreateExamTemplateUseCase(examTemplateRepository, questionRepository),
    new ListExamTemplatesUseCase(examTemplateRepository),
    new GetExamTemplateUseCase(examTemplateRepository),
    new UpdateExamTemplateUseCase(examTemplateRepository, questionRepository),
    new DeleteExamTemplateUseCase(examTemplateRepository),
    new GenerateExamInstancesUseCase(
      examTemplateRepository,
      examInstanceRepository,
      pdfGeneratorService,
      csvService,
      artifactsBaseDir
    )
  );
  const examController = new ExamController(
    new GradeExamsUseCase(
      csvService,
      examInstanceRepository,
      examTemplateRepository,
      examReportRepository
    ),
    getDashboardMetricsUseCase,
    new GenerateClassInsightsUseCase(getDashboardMetricsUseCase, llmProviderService)
  );

  const app = express();
  const allowedOrigins = new Set(["http://127.0.0.1:5173", "http://localhost:5173"]);

  app.use((request, response, next) => {
    const origin = request.headers.origin;

    if (origin && allowedOrigins.has(origin)) {
      response.header("Access-Control-Allow-Origin", origin);
      response.header("Vary", "Origin");
      response.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      response.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }

    next();
  });

  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use("/questions", createQuestionRouter(questionController));
  app.use("/exam-templates", createExamTemplateRouter(examTemplateController));
  app.use("/exams", createExamRouter(examController));
  app.use(errorHandler);

  return app;
};
