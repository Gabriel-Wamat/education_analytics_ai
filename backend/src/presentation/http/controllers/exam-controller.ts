import { Request, Response } from "express";

import { GenerateClassInsightsUseCase } from "../../../application/use-cases/generate-class-insights-use-case";
import { GetDashboardMetricsUseCase } from "../../../application/use-cases/get-dashboard-metrics-use-case";
import { ValidationError } from "../../../application/errors/validation-error";
import { GradeExamsUseCase } from "../../../application/use-cases/grade-exams-use-case";

type UploadedFiles = Record<string, Express.Multer.File[]>;

export class ExamController {
  constructor(
    private readonly gradeExamsUseCase: GradeExamsUseCase,
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
    private readonly generateClassInsightsUseCase: GenerateClassInsightsUseCase
  ) {}

  grade = async (request: Request, response: Response): Promise<void> => {
    const files = (request.files as UploadedFiles | undefined) ?? {};
    const answerKeyFile = files.answerKeyFile?.[0];
    const studentResponsesFile = files.studentResponsesFile?.[0];

    if (!answerKeyFile || !studentResponsesFile) {
      throw new ValidationError(
        "Os arquivos de gabarito e respostas dos alunos são obrigatórios."
      );
    }

    const report = await this.gradeExamsUseCase.execute({
      answerKeyFile: {
        buffer: answerKeyFile.buffer,
        fileName: answerKeyFile.originalname
      },
      studentResponsesFile: {
        buffer: studentResponsesFile.buffer,
        fileName: studentResponsesFile.originalname
      },
      gradingStrategyType: request.body.gradingStrategyType
    });

    response.status(200).json(report);
  };

  getMetrics = async (request: Request, response: Response): Promise<void> => {
    const metrics = await this.getDashboardMetricsUseCase.execute(request.params.id as string);
    response.status(200).json(metrics);
  };

  getInsights = async (request: Request, response: Response): Promise<void> => {
    const insights = await this.generateClassInsightsUseCase.execute(request.params.id as string);
    response.status(200).json(insights);
  };
}
