import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  classesApi,
  ClassGroupFormValues,
  SetEvaluationValues
} from "@/services/api/classes.api";
import { ClassEvaluationsResponse, ClassGroup } from "@/types/api";

export const classesQueryKey = ["classes"] as const;
export const classEvaluationsQueryKey = (classId: string) =>
  ["classes", classId, "evaluations"] as const;

export const useClassGroups = () =>
  useQuery<ClassGroup[]>({
    queryKey: classesQueryKey,
    queryFn: classesApi.list
  });

export const useClassGroup = (classId: string | undefined) =>
  useQuery<ClassGroup>({
    queryKey: ["classes", classId] as const,
    queryFn: () => classesApi.get(classId as string),
    enabled: Boolean(classId)
  });

export const useClassEvaluations = (classId: string | undefined) =>
  useQuery<ClassEvaluationsResponse>({
    queryKey: classId ? classEvaluationsQueryKey(classId) : ["classes", "evaluations"],
    queryFn: () => classesApi.listEvaluations(classId as string),
    enabled: Boolean(classId)
  });

export const useCreateClassGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClassGroupFormValues) => classesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classesQueryKey });
    }
  });
};

export const useUpdateClassGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClassGroupFormValues }) =>
      classesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: classesQueryKey });
      queryClient.invalidateQueries({ queryKey: ["classes", variables.id] });
      queryClient.invalidateQueries({ queryKey: classEvaluationsQueryKey(variables.id) });
    }
  });
};

export const useDeleteClassGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classesQueryKey });
    }
  });
};

export const useSetEvaluation = (classId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetEvaluationValues) =>
      classesApi.setEvaluation(classId as string, payload),
    onSuccess: () => {
      if (classId) {
        queryClient.invalidateQueries({ queryKey: classEvaluationsQueryKey(classId) });
      }
    }
  });
};
