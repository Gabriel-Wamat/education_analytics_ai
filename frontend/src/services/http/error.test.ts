import axios from "axios";

import { normalizeApiError } from "@/services/http/error";

describe("normalizeApiError", () => {
  it("prioritizes backend message and details from axios errors", () => {
    const error = new axios.AxiosError("Request failed", "400", undefined, undefined, {
      data: {
        message: "Falha de validação da API.",
        details: ["Campo obrigatório"]
      },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: {} as never }
    });

    expect(normalizeApiError(error)).toEqual({
      message: "Falha de validação da API.",
      details: ["Campo obrigatório"]
    });
  });

  it("falls back to generic error message for unknown values", () => {
    expect(normalizeApiError(null)).toEqual({
      message: "Não foi possível concluir a operação."
    });
  });
});
