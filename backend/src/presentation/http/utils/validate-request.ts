import { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodSchema } from "zod";

export const validateBody = <T>(schema: ZodSchema<T>): RequestHandler => {
  return (request: Request, _response: Response, next: NextFunction) => {
    request.body = schema.parse(request.body);
    next();
  };
};

export const validateParams = <T>(schema: ZodSchema<T>): RequestHandler => {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsedParams = schema.parse(request.params);
    Object.assign(request.params, parsedParams);
    next();
  };
};
