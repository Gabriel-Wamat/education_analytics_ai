import { httpClient } from "@/services/http/client";
import {
  ClassEvaluationsResponse,
  ClassGroup,
  Evaluation,
  EvaluationLevel
} from "@/types/api";

export interface ClassGroupFormValues {
  topic: string;
  year: number;
  semester: 1 | 2;
  studentIds: string[];
  goalIds: string[];
}

export interface SetEvaluationValues {
  studentId: string;
  goalId: string;
  level: EvaluationLevel;
}

const ensureClassArray = (payload: unknown): ClassGroup[] => {
  if (!Array.isArray(payload)) {
    throw new Error("A API de turmas retornou um formato inválido.");
  }
  return payload as ClassGroup[];
};

export const classesApi = {
  list: async (): Promise<ClassGroup[]> => {
    const response = await httpClient.get<ClassGroup[]>("/classes");
    return ensureClassArray(response.data);
  },
  get: async (classId: string): Promise<ClassGroup> => {
    const response = await httpClient.get<ClassGroup>(`/classes/${classId}`);
    return response.data;
  },
  create: async (payload: ClassGroupFormValues): Promise<ClassGroup> => {
    const response = await httpClient.post<ClassGroup>("/classes", payload);
    return response.data;
  },
  update: async (classId: string, payload: ClassGroupFormValues): Promise<ClassGroup> => {
    const response = await httpClient.put<ClassGroup>(`/classes/${classId}`, payload);
    return response.data;
  },
  remove: async (classId: string): Promise<void> => {
    await httpClient.delete(`/classes/${classId}`);
  },
  listEvaluations: async (classId: string): Promise<ClassEvaluationsResponse> => {
    const response = await httpClient.get<ClassEvaluationsResponse>(
      `/classes/${classId}/evaluations`
    );
    return response.data;
  },
  setEvaluation: async (
    classId: string,
    payload: SetEvaluationValues
  ): Promise<Evaluation> => {
    const response = await httpClient.put<Evaluation>(
      `/classes/${classId}/evaluations`,
      payload
    );
    return response.data;
  }
};
