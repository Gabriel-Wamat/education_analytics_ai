import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { goalsApi, GoalFormValues } from "@/services/api/goals.api";
import { Goal } from "@/types/api";

export const goalsQueryKey = ["goals"] as const;

export const useGoals = () =>
  useQuery<Goal[]>({
    queryKey: goalsQueryKey,
    queryFn: goalsApi.list
  });

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoalFormValues) => goalsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKey });
    }
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GoalFormValues }) =>
      goalsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKey });
    }
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    }
  });
};
