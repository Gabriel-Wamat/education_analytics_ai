import { ApplicationError } from "./application-error";

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: string[]) {
    super(message, 400, details);
  }
}
