import { httpClient } from "@/services/http/client";
import { EmailLog, SendManualEmailPayload, SendManualEmailResponse } from "@/types/api";

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
  },
  sendManual: async (
    payload: SendManualEmailPayload
  ): Promise<SendManualEmailResponse> => {
    const response = await httpClient.post<SendManualEmailResponse>("/email/send", payload);
    return response.data;
  }
};
