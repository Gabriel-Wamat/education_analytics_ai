import OpenAI from "openai";

import { DashboardMetricsResponse } from "../../application/dto/dashboard-metrics-response";
import {
  LLMProviderError,
  LLMTimeoutError
} from "../../application/errors/llm-provider-error";
import { ILLMProviderService } from "../../application/services/llm-provider-service";
import { buildPedagogicalInsightsPrompt } from "../../application/support/pedagogical-insights-prompt-builder";

export interface OpenAIProviderServiceConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  timeoutMs?: number;
}

export class OpenAIProviderService implements ILLMProviderService {
  private readonly client?: OpenAI;
  private readonly model: string;

  constructor(private readonly config: OpenAIProviderServiceConfig = {}) {
    this.model = config.model ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

    const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return;
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseURL ?? process.env.OPENAI_BASE_URL,
      timeout: config.timeoutMs ?? Number(process.env.LLM_TIMEOUT_MS ?? 10000)
    });
  }

  async generateInsights(metricsData: DashboardMetricsResponse): Promise<string> {
    if (!this.client) {
      throw new LLMProviderError("OPENAI_API_KEY não configurada para gerar insights.");
    }

    try {
      const response = await this.client.responses.create({
        model: this.model,
        input: buildPedagogicalInsightsPrompt(metricsData)
      });
      const outputText = response.output_text?.trim();

      if (!outputText) {
        throw new LLMProviderError("O provedor de IA retornou uma resposta vazia.");
      }

      return outputText;
    } catch (error) {
      if (error instanceof LLMProviderError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : "Falha desconhecida no provedor de IA.";
      if (/timeout|timed out|abort/i.test(message)) {
        throw new LLMTimeoutError(message);
      }

      throw new LLMProviderError(message);
    }
  }
}
