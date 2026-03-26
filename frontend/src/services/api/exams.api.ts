import { httpClient } from "@/services/http/client";
import {
  ClassInsightsResponse,
  DashboardMetricsResponse,
  GradeExamsResponse,
  GradingStrategyType
} from "@/types/api";

export interface GradeExamPayload {
  gradingStrategyType: GradingStrategyType;
  answerKeyFile: File;
  studentResponsesFile: File;
}

export const examsApi = {
  grade: async (payload: GradeExamPayload): Promise<GradeExamsResponse> => {
    const formData = new FormData();
    formData.append("gradingStrategyType", payload.gradingStrategyType);
    formData.append("answerKeyFile", payload.answerKeyFile);
    formData.append("studentResponsesFile", payload.studentResponsesFile);

    const response = await httpClient.post<GradeExamsResponse>("/exams/grade", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    return response.data;
  },
  getMetrics: async (examId: string): Promise<DashboardMetricsResponse> => {
    const response = await httpClient.get<DashboardMetricsResponse>(`/exams/${examId}/metrics`);
    return response.data;
  },
  getInsights: async (examId: string): Promise<ClassInsightsResponse> => {
    const response = await httpClient.get<ClassInsightsResponse>(`/exams/${examId}/insights`);
    return response.data;
  }
};
