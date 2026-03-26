import { httpClient } from "@/services/http/client";
import { Question } from "@/types/api";
import { QuestionFormValues } from "@/types/ui";

const ensureQuestionArray = (payload: unknown): Question[] => {
  if (!Array.isArray(payload)) {
    throw new Error("A API de questões retornou um formato inválido.");
  }

  return payload as Question[];
};

export const questionsApi = {
  list: async (): Promise<Question[]> => {
    const response = await httpClient.get<Question[]>("/questions");
    return ensureQuestionArray(response.data);
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
