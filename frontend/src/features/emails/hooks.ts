import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { emailsApi } from "@/services/api/emails.api";
import { EmailLog, SendManualEmailPayload } from "@/types/api";

export const emailLogsQueryKey = ["email-logs"] as const;

export const useEmailLogs = () =>
  useQuery<EmailLog[]>({
    queryKey: emailLogsQueryKey,
    queryFn: emailsApi.list
  });

export const useSendManualEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendManualEmailPayload) => emailsApi.sendManual(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailLogsQueryKey });
    }
  });
};
