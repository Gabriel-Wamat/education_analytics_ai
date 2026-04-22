export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailDeliveryReport {
  accepted: string[];
  rejected: string[];
  messageId?: string;
  rawResponse?: unknown;
}

/**
 * Contrato genérico para envio de email. Implementações concretas vivem em
 * `infrastructure/services` (SMTP em produção, JSON transport em testes).
 */
export interface IEmailService {
  send(message: EmailMessage): Promise<EmailDeliveryReport>;
}
