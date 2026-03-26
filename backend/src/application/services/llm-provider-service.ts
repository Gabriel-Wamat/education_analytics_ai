import { DashboardMetricsResponse } from "../dto/dashboard-metrics-response";

export interface ILLMProviderService {
  generateInsights(metricsData: DashboardMetricsResponse): Promise<string>;
}
