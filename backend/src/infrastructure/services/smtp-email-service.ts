import {
  EmailDeliveryReport,
  EmailMessage,
  IEmailService
} from "../../application/services/email-service";
import { SmtpClient } from "./smtp-client";

export interface SmtpEmailServiceConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: { user: string; pass: string };
  from: string;
  timeoutMs?: number;
  tlsRejectUnauthorized?: boolean;
}

/**
 * Implementação real de IEmailService apoiada no SmtpClient built-in do
 * projeto (zero dependências externas). Usada em produção/dev quando há
 * credenciais SMTP válidas configuradas.
 */
export class SmtpEmailService implements IEmailService {
  private readonly client: SmtpClient;

  constructor(private readonly config: SmtpEmailServiceConfig) {
    this.client = new SmtpClient({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      timeoutMs: config.timeoutMs,
      tlsRejectUnauthorized: config.tlsRejectUnauthorized
    });
  }

  async send(message: EmailMessage): Promise<EmailDeliveryReport> {
    const result = await this.client.send({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html
    });
    return {
      accepted: result.accepted,
      rejected: result.rejected,
      messageId: result.messageId,
      rawResponse: result.response
    };
  }
}
