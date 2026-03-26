import { DashboardMetricsResponse } from "../../../backend/src/application/dto/dashboard-metrics-response";
import { LLMTimeoutError } from "../../../backend/src/application/errors/llm-provider-error";
import { ILLMProviderService } from "../../../backend/src/application/services/llm-provider-service";

type FakeLLMMode = "success" | "timeout";

export class FakeLLMProviderService implements ILLMProviderService {
  mode: FakeLLMMode = "success";
  responseText = "## Insights\n\nA turma teve dificuldade concentrada na primeira questão.";
  lastMetricsData?: DashboardMetricsResponse;

  reset(): void {
    this.mode = "success";
    this.responseText = "## Insights\n\nA turma teve dificuldade concentrada na primeira questão.";
    this.lastMetricsData = undefined;
  }

  async generateInsights(metricsData: DashboardMetricsResponse): Promise<string> {
    this.lastMetricsData = metricsData;

    if (this.mode === "timeout") {
      throw new LLMTimeoutError("Timeout simulado do provedor de IA.");
    }

    return this.responseText;
  }
}
