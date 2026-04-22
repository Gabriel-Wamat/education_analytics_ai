import { connect as connectTcp, Socket } from "node:net";
import { connect as connectTls, TLSSocket } from "node:tls";

/**
 * Implementação mínima de cliente SMTP utilizando apenas módulos built-in do
 * Node (`net` + `tls`), compatível com a maioria dos relays modernos
 * (Gmail, Mailgun, Amazon SES, Mailtrap, etc.).
 *
 * Suporta:
 *  - Conexão TLS implícita (porta 465)
 *  - Conexão com STARTTLS (porta 587)
 *  - AUTH PLAIN e AUTH LOGIN
 *  - Envio de mensagens multipart/alternative (text + html)
 *  - Timeout configurável
 *
 * Não é um substituto completo ao Nodemailer, mas cobre o essencial do
 * protocolo com dependências zero. Para evoluir (DKIM, anexos, etc.), basta
 * trocar a implementação concreta do IEmailService.
 */

export interface SmtpClientOptions {
  host: string;
  port: number;
  /** TLS implícito (geralmente porta 465). Se falso, tentará STARTTLS se disponível. */
  secure?: boolean;
  auth?: { user: string; pass: string };
  timeoutMs?: number;
  tlsRejectUnauthorized?: boolean;
}

export interface SmtpSendInput {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SmtpSendResult {
  accepted: string[];
  rejected: string[];
  messageId: string;
  response: string;
}

interface SmtpResponse {
  code: number;
  lines: string[];
}

const CRLF = "\r\n";

const encodeBase64 = (value: string): string => Buffer.from(value, "utf-8").toString("base64");

const splitAddress = (address: string): { local: string; domain: string } => {
  const atIndex = address.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === address.length - 1) {
    throw new Error(`Endereço de email inválido: ${address}`);
  }
  return {
    local: address.slice(0, atIndex),
    domain: address.slice(atIndex + 1)
  };
};

const extractMessageId = (response: string): string | undefined => {
  const match = response.match(/\bid=([^\s]+)/i) ?? response.match(/\b([A-Za-z0-9]{10,})\b/);
  return match?.[1];
};

const buildMimeMessage = (input: SmtpSendInput, messageId: string, domain: string): string => {
  const date = new Date().toUTCString();
  const boundary = `mixed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const headers: string[] = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${encodeHeader(input.subject)}`,
    `Date: ${date}`,
    `Message-ID: <${messageId}@${domain}>`,
    "MIME-Version: 1.0"
  ];

  if (input.html) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    const body =
      `--${boundary}${CRLF}` +
      `Content-Type: text/plain; charset="utf-8"${CRLF}` +
      `Content-Transfer-Encoding: 8bit${CRLF}${CRLF}` +
      `${input.text}${CRLF}` +
      `--${boundary}${CRLF}` +
      `Content-Type: text/html; charset="utf-8"${CRLF}` +
      `Content-Transfer-Encoding: 8bit${CRLF}${CRLF}` +
      `${input.html}${CRLF}` +
      `--${boundary}--${CRLF}`;
    return `${headers.join(CRLF)}${CRLF}${CRLF}${body}`;
  }

  headers.push(`Content-Type: text/plain; charset="utf-8"`);
  headers.push(`Content-Transfer-Encoding: 8bit`);
  return `${headers.join(CRLF)}${CRLF}${CRLF}${input.text}${CRLF}`;
};

const encodeHeader = (value: string): string => {
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
};

const dotStuff = (message: string): string =>
  message
    .split(CRLF)
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join(CRLF);

export class SmtpClient {
  constructor(private readonly options: SmtpClientOptions) {}

  async send(input: SmtpSendInput): Promise<SmtpSendResult> {
    const socket = await this.openSocket();
    const conn = new SmtpConnection(socket, this.options.timeoutMs ?? 15_000);
    try {
      await conn.readResponse(220);
      let response = await conn.command(`EHLO ${splitAddress(input.from).domain || "localhost"}`, 250);

      if (!this.options.secure && this.supports(response, "STARTTLS")) {
        await conn.command("STARTTLS", 220);
        await conn.upgradeToTls(this.options.host, this.options.tlsRejectUnauthorized ?? true);
        response = await conn.command(`EHLO ${splitAddress(input.from).domain || "localhost"}`, 250);
      }

      if (this.options.auth) {
        await this.authenticate(conn, response);
      }

      await conn.command(`MAIL FROM:<${input.from}>`, 250);
      await conn.command(`RCPT TO:<${input.to}>`, 250);
      await conn.command("DATA", 354);

      const messageId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      const domain = splitAddress(input.from).domain || "localhost";
      const body = buildMimeMessage(input, messageId, domain);
      const finalResponse = await conn.command(`${dotStuff(body)}${CRLF}.`, 250);

      try {
        await conn.command("QUIT", 221);
      } catch {
        // Alguns servidores fecham a conexão antes de responder; aceitar silenciosamente.
      }

      const responseText = finalResponse.lines.join("\n");
      return {
        accepted: [input.to],
        rejected: [],
        messageId: extractMessageId(responseText) ?? messageId,
        response: responseText
      };
    } catch (error) {
      conn.destroy();
      throw error;
    }
  }

  private supports(response: SmtpResponse, keyword: string): boolean {
    const normalized = keyword.toUpperCase();
    return response.lines.some((line) => line.trim().toUpperCase().startsWith(normalized));
  }

  private async authenticate(conn: SmtpConnection, ehloResponse: SmtpResponse): Promise<void> {
    const auth = this.options.auth!;
    const authLine = ehloResponse.lines.find((line) => line.toUpperCase().includes("AUTH"));
    const mechs = authLine ? authLine.toUpperCase().split(/\s+/).filter((m) => m !== "AUTH") : [];
    if (mechs.includes("PLAIN")) {
      const payload = encodeBase64(`\0${auth.user}\0${auth.pass}`);
      await conn.command(`AUTH PLAIN ${payload}`, 235);
      return;
    }
    if (mechs.includes("LOGIN") || mechs.length === 0) {
      await conn.command("AUTH LOGIN", 334);
      await conn.command(encodeBase64(auth.user), 334);
      await conn.command(encodeBase64(auth.pass), 235);
      return;
    }
    throw new Error(`Servidor SMTP não suporta mecanismos conhecidos de autenticação (oferece: ${mechs.join(", ") || "nenhum"}).`);
  }

  private async openSocket(): Promise<Socket | TLSSocket> {
    return new Promise((resolve, reject) => {
      const onError = (error: Error): void => reject(error);
      let socket: Socket | TLSSocket;
      if (this.options.secure) {
        socket = connectTls({
          host: this.options.host,
          port: this.options.port,
          rejectUnauthorized: this.options.tlsRejectUnauthorized ?? true
        }, () => {
          socket.removeListener("error", onError);
          resolve(socket);
        });
      } else {
        socket = connectTcp({ host: this.options.host, port: this.options.port }, () => {
          socket.removeListener("error", onError);
          resolve(socket);
        });
      }
      socket.once("error", onError);
    });
  }
}

/** Pequena FSM para ler respostas SMTP multilinha delimitadas por CRLF. */
class SmtpConnection {
  private buffer = "";
  private pending?: {
    resolve: (response: SmtpResponse) => void;
    reject: (error: Error) => void;
    expectedCode?: number;
  };
  private socket: Socket | TLSSocket;

  constructor(socket: Socket | TLSSocket, private readonly timeoutMs: number) {
    this.socket = socket;
    this.socket.setEncoding("utf-8");
    this.socket.on("data", (chunk: string) => {
      this.buffer += chunk;
      this.drainBuffer();
    });
    this.socket.on("error", (error) => {
      if (this.pending) {
        this.pending.reject(error);
        this.pending = undefined;
      }
    });
  }

  async command(line: string, expectedCode?: number): Promise<SmtpResponse> {
    await this.write(`${line}${CRLF}`);
    return this.readResponse(expectedCode);
  }

  async readResponse(expectedCode?: number): Promise<SmtpResponse> {
    return new Promise<SmtpResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending = undefined;
        reject(new Error("Timeout aguardando resposta SMTP."));
      }, this.timeoutMs);
      this.pending = {
        expectedCode,
        resolve: (response) => {
          clearTimeout(timer);
          if (expectedCode && response.code !== expectedCode) {
            reject(new Error(`SMTP esperava ${expectedCode}, recebeu ${response.code}: ${response.lines.join(" | ")}`));
            return;
          }
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        }
      };
      this.drainBuffer();
    });
  }

  private drainBuffer(): void {
    if (!this.pending) return;
    const complete = this.tryParseResponse();
    if (complete) {
      const handler = this.pending;
      this.pending = undefined;
      handler.resolve(complete);
    }
  }

  private tryParseResponse(): SmtpResponse | undefined {
    const lines: string[] = [];
    let remaining = this.buffer;
    let code = 0;
    while (true) {
      const eol = remaining.indexOf(CRLF);
      if (eol === -1) return undefined;
      const line = remaining.slice(0, eol);
      remaining = remaining.slice(eol + CRLF.length);
      if (line.length < 4) return undefined;
      const currentCode = Number(line.slice(0, 3));
      if (Number.isNaN(currentCode)) return undefined;
      code = currentCode;
      lines.push(line.slice(4));
      if (line.charAt(3) === " ") {
        this.buffer = remaining;
        return { code, lines };
      }
      if (line.charAt(3) !== "-") return undefined;
    }
  }

  async write(data: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.socket.write(data, (error) => (error ? reject(error) : resolve()));
    });
  }

  async upgradeToTls(host: string, rejectUnauthorized: boolean): Promise<void> {
    const plain = this.socket;
    this.socket = await new Promise<TLSSocket>((resolve, reject) => {
      const secure = connectTls(
        { socket: plain, host, rejectUnauthorized },
        () => {
          secure.removeListener("error", reject);
          resolve(secure);
        }
      );
      secure.once("error", reject);
    });
    this.socket.setEncoding("utf-8");
    this.buffer = "";
    this.socket.on("data", (chunk: string) => {
      this.buffer += chunk;
      this.drainBuffer();
    });
    this.socket.on("error", (error) => {
      if (this.pending) {
        this.pending.reject(error);
        this.pending = undefined;
      }
    });
  }

  destroy(): void {
    this.socket.destroy();
  }
}
