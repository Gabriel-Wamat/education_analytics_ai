import { EmailLog } from "../../domain/entities/email-log";
import { IEmailLogRepository } from "../../domain/repositories/email-log-repository";

export class ListEmailLogsUseCase {
  constructor(private readonly emailLogRepository: IEmailLogRepository) {}

  async execute(): Promise<EmailLog[]> {
    return this.emailLogRepository.findAll();
  }
}
