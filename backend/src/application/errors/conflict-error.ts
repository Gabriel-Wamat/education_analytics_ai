import { ApplicationError } from "./application-error";

export class ConflictError extends ApplicationError {
  constructor(message: string, details?: string[]) {
    super(message, 409, details);
  }
}
