import { useMutation, useQuery } from "@tanstack/react-query";

import {
  CreateExamTemplatePayload,
  examTemplatesApi,
  GenerateExamArtifactsPayload
} from "@/services/api/exam-templates.api";

export const examTemplateKeys = {
  byId: (examTemplateId: string) => ["exam-template", examTemplateId] as const
};

export const useCreateExamTemplate = () =>
  useMutation({
    mutationFn: (payload: CreateExamTemplatePayload) => examTemplatesApi.create(payload)
  });

export const useExamTemplateById = (examTemplateId: string, enabled = true) =>
  useQuery({
    queryKey: examTemplateKeys.byId(examTemplateId),
    queryFn: () => examTemplatesApi.getById(examTemplateId),
    enabled: enabled && Boolean(examTemplateId)
  });

export const useGenerateExamInstances = (examTemplateId: string) =>
  useMutation({
    mutationFn: (payload: GenerateExamArtifactsPayload) =>
      examTemplatesApi.generate(examTemplateId, payload)
  });
