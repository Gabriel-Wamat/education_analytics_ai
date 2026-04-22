import { EmailDigestEntry } from "../entities/email-notification";

export interface IEmailDigestRepository {
  enqueue(entry: EmailDigestEntry): Promise<EmailDigestEntry>;
  findPendingByStudentAndDate(
    studentId: string,
    digestDate: string
  ): Promise<EmailDigestEntry[]>;
  findAllPendingByDate(digestDate: string): Promise<EmailDigestEntry[]>;
  findAllPending(): Promise<EmailDigestEntry[]>;
  findAll(): Promise<EmailDigestEntry[]>;
  markSent(ids: string[], sentAt: Date): Promise<void>;
  markFailed(ids: string[], reason: string): Promise<void>;
  /** Limpa entradas concluídas (sent ou failed) anteriores ao corte. */
  purgeBefore(date: Date): Promise<number>;
}
