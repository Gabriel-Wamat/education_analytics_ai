import axios, { AxiosError } from "axios";

export interface ApiErrorShape {
  message: string;
  details?: string[];
}

export const normalizeApiError = (error: unknown): ApiErrorShape => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as Partial<ApiErrorShape> | undefined;

    return {
      message:
        responseData?.message ||
        error.message ||
        "Não foi possível concluir a operação.",
      details: responseData?.details
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message
    };
  }

  return {
    message: "Não foi possível concluir a operação."
  };
};

export const isApiErrorWithStatus = (
  error: unknown,
  statusCode: number
): error is AxiosError<ApiErrorShape> =>
  axios.isAxiosError(error) && error.response?.status === statusCode;
