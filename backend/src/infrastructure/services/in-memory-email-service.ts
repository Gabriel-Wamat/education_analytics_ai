import {
  EmailDeliveryReport,
  EmailMessage,
  IEmailService
} from "../../application/services/email-service";

/**
 * Implementação para testes que apenas guarda as mensagens enviadas em
 * memória. Não realiza I/O de rede. Útil para acelerar a bateria de testes
 * sem depender de um servidor SMTP.
 */
export class InMemoryEmailService implements IEmailService {
  private readonly sentMessages: EmailMessage[] = [];
  private shouldFail = false;
  private failureReason = "Simulated failure";

  async send(message: EmailMessage): Promise<EmailDeliveryReport> {
    if (this.shouldFail) {
      throw new Error(this.failureReason);
    }
    this.sentMessages.push(message);
    return {
      accepted: [message.to],
      rejected: [],
      messageId: `in-memory-${this.sentMessages.length}`
    };
  }

  getSent(): EmailMessage[] {
    return [...this.sentMessages];
  }

  reset(): void {
    this.sentMessages.length = 0;
    this.shouldFail = false;
  }

  simulateFailure(reason?: string): void {
    this.shouldFail = true;
    if (reason) this.failureReason = reason;
  }
}
