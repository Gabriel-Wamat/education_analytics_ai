import path from "node:path";

import express, { Express } from "express";
import { PrismaClient } from "@prisma/client";

import { IEmailService } from "../../application/services/email-service";
import { IClock, SystemClock } from "../../application/services/clock";
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
import { CreateStudentUseCase } from "../../application/use-cases/create-student-use-case";
import { DeleteStudentUseCase } from "../../application/use-cases/delete-student-use-case";
import { GetStudentUseCase } from "../../application/use-cases/get-student-use-case";
import { ListStudentsUseCase } from "../../application/use-cases/list-students-use-case";
import { UpdateStudentUseCase } from "../../application/use-cases/update-student-use-case";
import { CreateGoalUseCase } from "../../application/use-cases/create-goal-use-case";
import { DeleteGoalUseCase } from "../../application/use-cases/delete-goal-use-case";
import { ListGoalsUseCase } from "../../application/use-cases/list-goals-use-case";
import { UpdateGoalUseCase } from "../../application/use-cases/update-goal-use-case";
import { CreateClassGroupUseCase } from "../../application/use-cases/create-class-group-use-case";
import { DeleteClassGroupUseCase } from "../../application/use-cases/delete-class-group-use-case";
import { GetClassGroupUseCase } from "../../application/use-cases/get-class-group-use-case";
import { ListClassGroupsUseCase } from "../../application/use-cases/list-class-groups-use-case";
import { ListEvaluationsByClassUseCase } from "../../application/use-cases/list-evaluations-by-class-use-case";
import { SetEvaluationUseCase } from "../../application/use-cases/set-evaluation-use-case";
import { UpdateClassGroupUseCase } from "../../application/use-cases/update-class-group-use-case";
import { SendEvaluationDigestUseCase } from "../../application/use-cases/send-evaluation-digest-use-case";
import { ILLMProviderService } from "../../application/services/llm-provider-service";
import { createPrismaClient } from "../database/prisma/client";
import { PrismaExamInstanceRepository } from "../repositories/prisma-exam-instance-repository";
import { PrismaExamReportRepository } from "../repositories/prisma-exam-report-repository";
import { PrismaExamTemplateRepository } from "../repositories/prisma-exam-template-repository";
import { PrismaQuestionRepository } from "../repositories/prisma-question-repository";
import { JsonStudentRepository } from "../repositories/json/json-student-repository";
import { JsonGoalRepository } from "../repositories/json/json-goal-repository";
import { JsonClassGroupRepository } from "../repositories/json/json-class-group-repository";
import { JsonEvaluationRepository } from "../repositories/json/json-evaluation-repository";
import { JsonEmailDigestRepository } from "../repositories/json/json-email-digest-repository";
import { ConsoleEmailService } from "../services/console-email-service";
import { CsvFileService } from "../services/csv-file-service";
import { OpenAIProviderService } from "../services/openai-provider-service";
import { PdfKitPdfGeneratorService } from "../services/pdfkit-pdf-generator-service";
import { SmtpEmailService } from "../services/smtp-email-service";
import { ExamController } from "../../presentation/http/controllers/exam-controller";
import { ExamTemplateController } from "../../presentation/http/controllers/exam-template-controller";
import { QuestionController } from "../../presentation/http/controllers/question-controller";
import { StudentController } from "../../presentation/http/controllers/student-controller";
import { GoalController } from "../../presentation/http/controllers/goal-controller";
import { ClassGroupController } from "../../presentation/http/controllers/class-group-controller";
import { EmailDigestController } from "../../presentation/http/controllers/email-digest-controller";
import { errorHandler } from "../../presentation/http/middlewares/error-handler";
import { createExamRouter } from "../../presentation/http/routes/exam-routes";
import { createExamTemplateRouter } from "../../presentation/http/routes/exam-template-routes";
import { createQuestionRouter } from "../../presentation/http/routes/question-routes";
import { createStudentRouter } from "../../presentation/http/routes/student-routes";
import { createGoalRouter } from "../../presentation/http/routes/goal-routes";
import { createClassGroupRouter } from "../../presentation/http/routes/class-group-routes";
import { createEmailDigestRouter } from "../../presentation/http/routes/email-digest-routes";

export interface AppDependencies {
  prismaClient?: PrismaClient;
  artifactsBaseDir?: string;
  llmProviderService?: ILLMProviderService;
  jsonStorageDir?: string;
  emailService?: IEmailService;
  emailFromAddress?: string;
  clock?: IClock;
}

const resolveEmailService = (dependencies: AppDependencies): IEmailService => {
  if (dependencies.emailService) return dependencies.emailService;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true";

  if (host && port && !Number.isNaN(port)) {
    return new SmtpEmailService({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      from:
        dependencies.emailFromAddress ??
        process.env.SMTP_FROM ??
        "no-reply@education-analytics.local"
    });
  }

  // Sem SMTP configurado: cai para o serviço de console (desenvolvimento).
  return new ConsoleEmailService();
};

export const createApp = (dependencies: AppDependencies = {}): Express => {
  const prismaClient = dependencies.prismaClient ?? createPrismaClient();
  const artifactsBaseDir =
    dependencies.artifactsBaseDir ?? path.resolve(process.cwd(), "output/exam-batches");
  const jsonStorageDir =
    dependencies.jsonStorageDir ?? path.resolve(process.cwd(), "data");
  const clock = dependencies.clock ?? new SystemClock();
  const emailService = resolveEmailService(dependencies);
  const defaultFromAddress =
    dependencies.emailFromAddress ??
    process.env.SMTP_FROM ??
    "no-reply@education-analytics.local";

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

  // Novos repositórios JSON
  const studentRepository = new JsonStudentRepository(
    path.join(jsonStorageDir, "students.json")
  );
  const goalRepository = new JsonGoalRepository(path.join(jsonStorageDir, "goals.json"));
  const classGroupRepository = new JsonClassGroupRepository(
    path.join(jsonStorageDir, "classes.json")
  );
  const evaluationRepository = new JsonEvaluationRepository(
    path.join(jsonStorageDir, "evaluations.json")
  );
  const emailDigestRepository = new JsonEmailDigestRepository(
    path.join(jsonStorageDir, "email-digest-queue.json")
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

  const studentController = new StudentController(
    new CreateStudentUseCase(studentRepository),
    new ListStudentsUseCase(studentRepository),
    new GetStudentUseCase(studentRepository),
    new UpdateStudentUseCase(studentRepository),
    new DeleteStudentUseCase(
      studentRepository,
      classGroupRepository,
      evaluationRepository
    )
  );

  const goalController = new GoalController(
    new CreateGoalUseCase(goalRepository),
    new ListGoalsUseCase(goalRepository),
    new UpdateGoalUseCase(goalRepository),
    new DeleteGoalUseCase(goalRepository, classGroupRepository, evaluationRepository)
  );

  const setEvaluationUseCase = new SetEvaluationUseCase(
    evaluationRepository,
    classGroupRepository,
    studentRepository,
    goalRepository,
    emailDigestRepository,
    clock
  );

  const classGroupController = new ClassGroupController(
    new CreateClassGroupUseCase(classGroupRepository, studentRepository, goalRepository),
    new ListClassGroupsUseCase(classGroupRepository),
    new GetClassGroupUseCase(classGroupRepository),
    new UpdateClassGroupUseCase(
      classGroupRepository,
      studentRepository,
      goalRepository,
      evaluationRepository
    ),
    new DeleteClassGroupUseCase(classGroupRepository, evaluationRepository),
    setEvaluationUseCase,
    new ListEvaluationsByClassUseCase(evaluationRepository, classGroupRepository)
  );

  const sendEvaluationDigestUseCase = new SendEvaluationDigestUseCase(
    emailDigestRepository,
    studentRepository,
    classGroupRepository,
    goalRepository,
    emailService,
    clock
  );
  const emailDigestController = new EmailDigestController(
    sendEvaluationDigestUseCase,
    defaultFromAddress
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
  app.use("/students", createStudentRouter(studentController));
  app.use("/goals", createGoalRouter(goalController));
  app.use("/classes", createClassGroupRouter(classGroupController));
  app.use("/email", createEmailDigestRouter(emailDigestController));
  app.use(errorHandler);

  // Exposição opcional do use-case para agendadores/serviços externos.
  (app as unknown as { sendEvaluationDigestUseCase: SendEvaluationDigestUseCase }).sendEvaluationDigestUseCase =
    sendEvaluationDigestUseCase;

  return app;
};
