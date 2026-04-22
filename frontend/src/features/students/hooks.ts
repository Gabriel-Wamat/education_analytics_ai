import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { studentsApi, StudentFormValues } from "@/services/api/students.api";
import { Student } from "@/types/api";

export const studentsQueryKey = ["students"] as const;

export const useStudents = () =>
  useQuery<Student[]>({
    queryKey: studentsQueryKey,
    queryFn: studentsApi.list
  });

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StudentFormValues) => studentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentsQueryKey });
    }
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StudentFormValues }) =>
      studentsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentsQueryKey });
    }
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    }
  });
};
