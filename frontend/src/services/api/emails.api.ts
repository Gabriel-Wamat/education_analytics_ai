import { httpClient } from "@/services/http/client";
import { EmailLog } from "@/types/api";

const ensureEmailLogArray = (payload: unknown): EmailLog[] => {
  if (!Array.isArray(payload)) {
    throw new Error("A API de e-mails retornou um formato inválido.");
  }
  return payload as EmailLog[];
};

export const emailsApi = {
  list: async (): Promise<EmailLog[]> => {
    const response = await httpClient.get<EmailLog[]>("/email/messages");
    return ensureEmailLogArray(response.data);
  }
};
