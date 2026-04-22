import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { ApplicationError } from "../../../application/errors/application-error";

export const errorHandler = (
  error: Error,
  request: Request,
  response: Response,
  _next: NextFunction
): void => {
  if (error instanceof ApplicationError) {
    response.status(error.statusCode).json({
      message: error.message,
      ...(error.details && error.details.length > 0 ? { details: error.details } : {})
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Falha na validação da requisição.",
      details: error.issues.map((issue) => issue.message)
    });
    return;
  }

  console.error(
    `[http-error] ${request.method} ${request.originalUrl}`,
    error instanceof Error ? { message: error.message, stack: error.stack } : error
  );

  response.status(500).json({
    message: "Erro interno do servidor."
  });
};
