import { httpClient } from "@/services/http/client";
import { EmailDigestRunResult } from "@/types/api";

export const emailApi = {
  processDigest: async (
    overrides?: { from?: string; digestDate?: string }
  ): Promise<EmailDigestRunResult> => {
    const response = await httpClient.post<EmailDigestRunResult>("/email/digest", overrides ?? {});
    return response.data;
  }
};
