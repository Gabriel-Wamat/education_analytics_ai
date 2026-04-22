import { EmailLog } from "../entities/email-log";

export interface IEmailLogRepository {
  create(entry: EmailLog): Promise<EmailLog>;
  findAll(): Promise<EmailLog[]>;
}
