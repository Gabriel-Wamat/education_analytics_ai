import {
  EmailDeliveryReport,
  EmailMessage,
  IEmailService
} from "../../application/services/email-service";

/**
 * Implementação de desenvolvimento: imprime o email formatado em stdout para
 * inspeção rápida. Útil quando não há servidor SMTP disponível.
 */
export class ConsoleEmailService implements IEmailService {
  async send(message: EmailMessage): Promise<EmailDeliveryReport> {
    const separator = "=".repeat(72);
    const output = [
      separator,
      `[email digest] -> ${message.to}`,
      `Subject: ${message.subject}`,
      separator,
      message.text,
      separator,
      ""
    ].join("\n");
    process.stdout.write(output);
    return {
      accepted: [message.to],
      rejected: [],
      messageId: `console-${Date.now().toString(36)}`
    };
  }
}
