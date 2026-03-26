import { httpClient } from "@/services/http/client";
import { Question } from "@/types/api";
import { QuestionFormValues } from "@/types/ui";

export const questionsApi = {
  list: async (): Promise<Question[]> => {
    const response = await httpClient.get<Question[]>("/questions");
    return response.data;
  },
  create: async (payload: QuestionFormValues): Promise<Question> => {
    const response = await httpClient.post<Question>("/questions", payload);
    return response.data;
  },
  update: async (questionId: string, payload: QuestionFormValues): Promise<Question> => {
    const response = await httpClient.put<Question>(`/questions/${questionId}`, payload);
    return response.data;
  },
  remove: async (questionId: string): Promise<void> => {
    await httpClient.delete(`/questions/${questionId}`);
  }
};
