import { httpClient } from "@/services/http/client";
import { Goal } from "@/types/api";

export interface GoalFormValues {
  name: string;
  description?: string;
}

const ensureGoalArray = (payload: unknown): Goal[] => {
  if (!Array.isArray(payload)) {
    throw new Error("A API de metas retornou um formato inválido.");
  }
  return payload as Goal[];
};

export const goalsApi = {
  list: async (): Promise<Goal[]> => {
    const response = await httpClient.get<Goal[]>("/goals");
    return ensureGoalArray(response.data);
  },
  create: async (payload: GoalFormValues): Promise<Goal> => {
    const response = await httpClient.post<Goal>("/goals", payload);
    return response.data;
  },
  update: async (goalId: string, payload: GoalFormValues): Promise<Goal> => {
    const response = await httpClient.put<Goal>(`/goals/${goalId}`, payload);
    return response.data;
  },
  remove: async (goalId: string): Promise<void> => {
    await httpClient.delete(`/goals/${goalId}`);
  }
};
