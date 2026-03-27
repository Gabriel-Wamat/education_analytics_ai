import { httpClient } from "@/services/http/client";
import {
  AlternativeIdentificationType,
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

export interface CreateExamTemplatePayload {
  title: string;
  questionIds: string[];
  alternativeIdentificationType: AlternativeIdentificationType;
  headerMetadata: ExamHeaderMetadata;
}

export interface GenerateExamArtifactsPayload {
  quantity: number;
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
  }
};
