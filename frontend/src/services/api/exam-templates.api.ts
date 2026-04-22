import { httpClient } from "@/services/http/client";
import {
  AlternativeIdentificationType,
  ExamBatchEmailDispatchResponse,
  ExamBatchDetail,
  ExamBatchSummary,
  ExamHeaderMetadata,
  ExamTemplate,
  GenerateExamInstancesResponse
} from "@/types/api";

const ensureExamTemplateArray = (payload: unknown): ExamTemplate[] => {
  if (!Array.isArray(payload)) {
    throw new Error("A API de provas retornou um formato inválido.");
  }

  return payload as ExamTemplate[];
};

const ensureExamBatchSummaryArray = (payload: unknown): ExamBatchSummary[] => {
  if (!Array.isArray(payload)) {
    throw new Error("A API de lotes retornou um formato inválido.");
  }

  return payload as ExamBatchSummary[];
};

export interface CreateExamTemplatePayload {
  title: string;
  questionIds: string[];
  alternativeIdentificationType: AlternativeIdentificationType;
  headerMetadata: ExamHeaderMetadata;
}

export interface GenerateExamArtifactsPayload {
  quantity: number;
}

export interface SendExamBatchToClassPayload {
  classId: string;
}

export const examTemplatesApi = {
  list: async (): Promise<ExamTemplate[]> => {
    const response = await httpClient.get<ExamTemplate[]>("/exam-templates");
    return ensureExamTemplateArray(response.data);
  },
  create: async (payload: CreateExamTemplatePayload): Promise<ExamTemplate> => {
    const response = await httpClient.post<ExamTemplate>("/exam-templates", payload);
    return response.data;
  },
  getById: async (examTemplateId: string): Promise<ExamTemplate> => {
    const response = await httpClient.get<ExamTemplate>(`/exam-templates/${examTemplateId}`);
    return response.data;
  },
  listBatches: async (examTemplateId: string): Promise<ExamBatchSummary[]> => {
    const response = await httpClient.get<ExamBatchSummary[]>(
      `/exam-templates/${examTemplateId}/batches`
    );
    return ensureExamBatchSummaryArray(response.data);
  },
  update: async (
    examTemplateId: string,
    payload: CreateExamTemplatePayload
  ): Promise<ExamTemplate> => {
    const response = await httpClient.put<ExamTemplate>(
      `/exam-templates/${examTemplateId}`,
      payload
    );
    return response.data;
  },
  remove: async (examTemplateId: string): Promise<void> => {
    await httpClient.delete(`/exam-templates/${examTemplateId}`);
  },
  generate: async (
    examTemplateId: string,
    payload: GenerateExamArtifactsPayload
  ): Promise<GenerateExamInstancesResponse> => {
    const response = await httpClient.post<GenerateExamInstancesResponse>(
      `/exam-templates/${examTemplateId}/generate`,
      payload
    );
    return response.data;
  },
  getBatchById: async (batchId: string): Promise<ExamBatchDetail> => {
    const response = await httpClient.get<ExamBatchDetail>(`/exam-batches/${batchId}`);
    return response.data;
  },
  sendBatchToClass: async (
    batchId: string,
    payload: SendExamBatchToClassPayload
  ): Promise<ExamBatchEmailDispatchResponse> => {
    const response = await httpClient.post<ExamBatchEmailDispatchResponse>(
      `/exam-batches/${batchId}/email-dispatch`,
      payload
    );
    return response.data;
  }
};
