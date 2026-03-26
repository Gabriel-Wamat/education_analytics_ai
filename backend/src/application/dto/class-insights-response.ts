import { DashboardMetricsResponse } from "./dashboard-metrics-response";

export interface ClassInsightsResponse {
  examId: string;
  metrics: DashboardMetricsResponse;
  insights: string | null;
  warning?: string;
  generatedAt: string;
}
