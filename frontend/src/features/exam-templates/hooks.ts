import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CreateExamTemplatePayload,
  examTemplatesApi,
  GenerateExamArtifactsPayload
} from "@/services/api/exam-templates.api";

export const examTemplateKeys = {
  all: ["exam-templates"] as const,
  byId: (examTemplateId: string) => ["exam-template", examTemplateId] as const,
  batches: (examTemplateId: string) => ["exam-template-batches", examTemplateId] as const,
  batchDetail: (batchId: string) => ["exam-batch", batchId] as const
};

export const useCreateExamTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExamTemplatePayload) => examTemplatesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: examTemplateKeys.all });
    }
  });
};

export const useExamTemplates = () =>
  useQuery({
    queryKey: examTemplateKeys.all,
    queryFn: () => examTemplatesApi.list()
  });

export const useExamTemplateById = (examTemplateId: string, enabled = true) =>
  useQuery({
    queryKey: examTemplateKeys.byId(examTemplateId),
    queryFn: () => examTemplatesApi.getById(examTemplateId),
    enabled: enabled && Boolean(examTemplateId)
  });

export const useGenerateExamInstances = (examTemplateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateExamArtifactsPayload) =>
      examTemplatesApi.generate(examTemplateId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: examTemplateKeys.batches(examTemplateId)
      });
    }
  });
};

export const useExamTemplateBatches = (examTemplateId: string, enabled = true) =>
  useQuery({
    queryKey: examTemplateKeys.batches(examTemplateId),
    queryFn: () => examTemplatesApi.listBatches(examTemplateId),
    enabled: enabled && Boolean(examTemplateId)
  });

export const useExamBatchById = (batchId: string, enabled = true) =>
  useQuery({
    queryKey: examTemplateKeys.batchDetail(batchId),
    queryFn: () => examTemplatesApi.getBatchById(batchId),
    enabled: enabled && Boolean(batchId)
  });
