import { ApplicationError } from "./application-error";

export class NotFoundError extends ApplicationError {
  constructor(message: string, details?: string[]) {
    super(message, 404, details);
  }
}
