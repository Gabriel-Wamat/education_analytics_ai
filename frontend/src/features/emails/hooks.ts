import { useQuery } from "@tanstack/react-query";

import { emailsApi } from "@/services/api/emails.api";
import { EmailLog } from "@/types/api";

export const emailLogsQueryKey = ["email-logs"] as const;

export const useEmailLogs = () =>
  useQuery<EmailLog[]>({
    queryKey: emailLogsQueryKey,
    queryFn: emailsApi.list
  });
