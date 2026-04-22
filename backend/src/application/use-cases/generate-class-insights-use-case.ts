import { ClassInsightsResponse } from "../dto/class-insights-response";
import { LLMProviderError, LLMTimeoutError } from "../errors/llm-provider-error";
import { ILLMProviderService } from "../services/llm-provider-service";
import { GetDashboardMetricsUseCase } from "./get-dashboard-metrics-use-case";

const INSIGHTS_UNAVAILABLE_WARNING = "Insights indisponíveis no momento.";

export class GenerateClassInsightsUseCase {
  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
    private readonly llmProviderService: ILLMProviderService
  ) {}

  async execute(examId: string): Promise<ClassInsightsResponse> {
    const metrics = await this.getDashboardMetricsUseCase.execute(examId);

    try {
      const insights = await this.llmProviderService.generateInsights(metrics);

      return {
        examId,
        metrics,
        insights,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof LLMTimeoutError || error instanceof LLMProviderError) {
        return {
          examId,
          metrics,
          insights: null,
          warning: INSIGHTS_UNAVAILABLE_WARNING,
          generatedAt: new Date().toISOString()
        };
      }

      throw error;
    }
  }

  async executeLatest(): Promise<ClassInsightsResponse> {
    const metrics = await this.getDashboardMetricsUseCase.executeLatest();

    try {
      const insights = await this.llmProviderService.generateInsights(metrics);

      return {
        examId: metrics.examId,
        metrics,
        insights,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof LLMTimeoutError || error instanceof LLMProviderError) {
        return {
          examId: metrics.examId,
          metrics,
          insights: null,
          warning: INSIGHTS_UNAVAILABLE_WARNING,
          generatedAt: new Date().toISOString()
        };
      }

      throw error;
    }
  }
}
