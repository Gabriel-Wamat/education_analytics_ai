import { DashboardMetricsResponse } from "../dto/dashboard-metrics-response";
import { NotFoundError } from "../errors/not-found-error";
import { IExamReportRepository } from "../../domain/repositories/exam-report-repository";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";
import { aggregateDashboardMetrics } from "../../domain/services/dashboard-metrics-aggregator";

export class GetDashboardMetricsUseCase {
  constructor(
    private readonly examReportRepository: IExamReportRepository,
    private readonly examTemplateRepository: IExamTemplateRepository
  ) {}

  async execute(examId: string): Promise<DashboardMetricsResponse> {
    const examReport = await this.examReportRepository.findById(examId);
    if (!examReport) {
      throw new NotFoundError("Relatório da prova não encontrado.");
    }

    const examTemplate = await this.examTemplateRepository.findById(examReport.templateId);
    if (!examTemplate) {
      throw new NotFoundError("Modelo de prova não encontrado para o relatório informado.");
    }

    return aggregateDashboardMetrics(examReport, examTemplate);
  }
}
