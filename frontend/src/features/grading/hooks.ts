import { useMutation } from "@tanstack/react-query";

import { examsApi, GradeExamPayload } from "@/services/api/exams.api";

export const useGradeExams = () =>
  useMutation({
    mutationFn: (payload: GradeExamPayload) => examsApi.grade(payload)
  });
