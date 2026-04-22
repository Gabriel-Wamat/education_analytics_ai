import { httpClient } from "@/services/http/client";
import { Student, StudentProfileResponse } from "@/types/api";

export interface StudentFormValues {
  name: string;
  cpf: string;
  email: string;
}

const ensureStudentArray = (payload: unknown): Student[] => {
  if (!Array.isArray(payload)) {
    throw new Error("A API de alunos retornou um formato inválido.");
  }
  return payload as Student[];
};

export const studentsApi = {
  list: async (): Promise<Student[]> => {
    const response = await httpClient.get<Student[]>("/students");
    return ensureStudentArray(response.data);
  },
  getProfile: async (studentId: string): Promise<StudentProfileResponse> => {
    const response = await httpClient.get<StudentProfileResponse>(`/students/${studentId}/profile`);
    return response.data;
  },
  create: async (payload: StudentFormValues): Promise<Student> => {
    const response = await httpClient.post<Student>("/students", payload);
    return response.data;
  },
  update: async (studentId: string, payload: StudentFormValues): Promise<Student> => {
    const response = await httpClient.put<Student>(`/students/${studentId}`, payload);
    return response.data;
  },
  remove: async (studentId: string): Promise<void> => {
    await httpClient.delete(`/students/${studentId}`);
  }
};
