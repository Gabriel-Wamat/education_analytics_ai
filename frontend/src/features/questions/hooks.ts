import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { questionsApi } from "@/services/api/questions.api";
import { Question } from "@/types/api";
import { QuestionFormValues } from "@/types/ui";

export const questionKeys = {
  all: ["questions"] as const
};

export const useQuestions = () =>
  useQuery({
    queryKey: questionKeys.all,
    queryFn: questionsApi.list
  });

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QuestionFormValues) => questionsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: questionKeys.all });
    }
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, payload }: { questionId: string; payload: QuestionFormValues }) =>
      questionsApi.update(questionId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: questionKeys.all });
    }
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => questionsApi.remove(questionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: questionKeys.all });
    }
  });
};

export const toQuestionFormValues = (question: Question): QuestionFormValues => ({
  topic: question.topic,
  unit: question.unit,
  statement: question.statement,
  options: question.options.map((option) => ({
    description: option.description,
    isCorrect: option.isCorrect
  }))
});
