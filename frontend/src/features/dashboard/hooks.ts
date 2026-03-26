import { useQuery } from "@tanstack/react-query";

import { examsApi } from "@/services/api/exams.api";

export const dashboardKeys = {
  metrics: (examId: string) => ["exam-metrics", examId] as const,
  insights: (examId: string) => ["exam-insights", examId] as const
};

export const useExamMetrics = (examId: string) =>
  useQuery({
    queryKey: dashboardKeys.metrics(examId),
    queryFn: () => examsApi.getMetrics(examId),
    enabled: Boolean(examId)
  });

export const useExamInsights = (examId: string) =>
  useQuery({
    queryKey: dashboardKeys.insights(examId),
    queryFn: () => examsApi.getInsights(examId),
    enabled: Boolean(examId)
  });
