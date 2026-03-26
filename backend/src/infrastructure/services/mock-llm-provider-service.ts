import { DashboardMetricsResponse } from "../../application/dto/dashboard-metrics-response";
import { ILLMProviderService } from "../../application/services/llm-provider-service";

export class MockLLMProviderService implements ILLMProviderService {
  constructor(private readonly responseText = "## Insights\n\nSem insights configurados.") {}

  async generateInsights(_metricsData: DashboardMetricsResponse): Promise<string> {
    return this.responseText;
  }
}
