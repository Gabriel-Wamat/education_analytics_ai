import { vi } from "vitest";

import { examTemplatesApi } from "@/services/api/exam-templates.api";
import { questionsApi } from "@/services/api/questions.api";
import { httpClient } from "@/services/http/client";

describe("API response guards", () => {
  it("throws when the questions endpoint does not return an array", async () => {
    vi.spyOn(httpClient, "get").mockResolvedValueOnce({
      data: { unexpected: true }
    } as never);

    await expect(questionsApi.list()).rejects.toThrow(
      "A API de questões retornou um formato inválido."
    );
  });

  it("throws when the exam templates endpoint does not return an array", async () => {
    vi.spyOn(httpClient, "get").mockResolvedValueOnce({
      data: "not-an-array"
    } as never);

    await expect(examTemplatesApi.list()).rejects.toThrow(
      "A API de provas retornou um formato inválido."
    );
  });
});
