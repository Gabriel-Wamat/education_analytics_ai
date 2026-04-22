import { randomUUID } from "node:crypto";

import { EmailLog } from "../../domain/entities/email-log";
import { EmailDigestEntry } from "../../domain/entities/email-notification";
import { EVALUATION_LEVEL_LABELS } from "../../domain/entities/evaluation-level";
import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";
import { IEmailDigestRepository } from "../../domain/repositories/email-digest-repository";
import { IEmailLogRepository } from "../../domain/repositories/email-log-repository";
import { IGoalRepository } from "../../domain/repositories/goal-repository";
import { IStudentRepository } from "../../domain/repositories/student-repository";
import { IEmailService, EmailMessage } from "../services/email-service";
import { IClock, SystemClock } from "../services/clock";

export interface DigestRunResult {
  digestDate: string;
  emailsSent: number;
  entriesProcessed: number;
  emailsFailed: number;
  digestsByStudent: Array<{
    studentId: string;
    email: string;
    name: string;
    entries: number;
    sent: boolean;
    error?: string;
  }>;
}

interface DigestRunOptions {
  digestDate?: string;
  fromAddress: string;
}

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

export class SendEvaluationDigestUseCase {
  constructor(
    private readonly emailDigestRepository: IEmailDigestRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly classGroupRepository: IClassGroupRepository,
    private readonly goalRepository: IGoalRepository,
    private readonly emailLogRepository: IEmailLogRepository,
    private readonly emailService: IEmailService,
    private readonly clock: IClock = new SystemClock()
  ) {}

  async execute(options: DigestRunOptions): Promise<DigestRunResult> {
    const digestDate = options.digestDate ?? formatDate(this.clock.now());
    const pending = await this.emailDigestRepository.findAllPendingByDate(digestDate);
    if (pending.length === 0) {
      return {
        digestDate,
        emailsSent: 0,
        entriesProcessed: 0,
        emailsFailed: 0,
        digestsByStudent: []
      };
    }

    const groupedByStudent = new Map<string, EmailDigestEntry[]>();
    for (const entry of pending) {
      const list = groupedByStudent.get(entry.studentId) ?? [];
      list.push(entry);
      groupedByStudent.set(entry.studentId, list);
    }

    const result: DigestRunResult = {
      digestDate,
      emailsSent: 0,
      entriesProcessed: 0,
      emailsFailed: 0,
      digestsByStudent: []
    };

    for (const [studentId, entries] of groupedByStudent) {
      const student = await this.studentRepository.findById(studentId);
      if (!student) {
        // Aluno apagado entre a fila e o envio: marca como falha e segue.
        await this.emailDigestRepository.markFailed(
          entries.map((entry) => entry.id),
          "Aluno não encontrado no momento do envio."
        );
        result.emailsFailed += 1;
        result.digestsByStudent.push({
          studentId,
          email: "",
          name: "",
          entries: entries.length,
          sent: false,
          error: "Aluno não encontrado no momento do envio."
        });
        continue;
      }

      const message = await this.composeMessage(student.email, student.name, entries, options.fromAddress);
      try {
        await this.emailService.send(message);
        await this.emailDigestRepository.markSent(
          entries.map((entry) => entry.id),
          this.clock.now()
        );
        await this.emailLogRepository.create(
          this.buildEmailLog({
            studentId,
            studentName: student.name,
            status: "sent",
            message,
            entries
          })
        );
        result.emailsSent += 1;
        result.entriesProcessed += entries.length;
        result.digestsByStudent.push({
          studentId,
          email: student.email,
          name: student.name,
          entries: entries.length,
          sent: true
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Erro desconhecido.";
        await this.emailDigestRepository.markFailed(entries.map((entry) => entry.id), reason);
        await this.emailLogRepository.create(
          this.buildEmailLog({
            studentId,
            studentName: student.name,
            status: "failed",
            message,
            entries,
            failureReason: reason
          })
        );
        result.emailsFailed += 1;
        result.digestsByStudent.push({
          studentId,
          email: student.email,
          name: student.name,
          entries: entries.length,
          sent: false,
          error: reason
        });
      }
    }

    return result;
  }

  private async composeMessage(
    to: string,
    studentName: string,
    entries: EmailDigestEntry[],
    fromAddress: string
  ): Promise<EmailMessage> {
    // Resolve nomes de turmas e metas em batch (cache em memória).
    const classCache = new Map<string, string>();
    const goalCache = new Map<string, string>();

    for (const entry of entries) {
      if (!classCache.has(entry.classId)) {
        const cls = await this.classGroupRepository.findById(entry.classId);
        classCache.set(
          entry.classId,
          cls ? `${cls.topic} (${cls.year}.${cls.semester})` : `Turma ${entry.classId}`
        );
      }
      if (!goalCache.has(entry.goalId)) {
        const goal = await this.goalRepository.findById(entry.goalId);
        goalCache.set(entry.goalId, goal ? goal.name : `Meta ${entry.goalId}`);
      }
    }

    // Mantém apenas a última alteração por (turma, meta) para o digest.
    const latestByClassGoal = new Map<string, EmailDigestEntry>();
    for (const entry of entries) {
      const key = `${entry.classId}::${entry.goalId}`;
      const current = latestByClassGoal.get(key);
      if (!current || current.changedAt < entry.changedAt) {
        latestByClassGoal.set(key, entry);
      }
    }

    const groupedByClass = new Map<string, EmailDigestEntry[]>();
    for (const entry of latestByClassGoal.values()) {
      const list = groupedByClass.get(entry.classId) ?? [];
      list.push(entry);
      groupedByClass.set(entry.classId, list);
    }

    const lines: string[] = [];
    const htmlSections: string[] = [];
    lines.push(`Olá, ${studentName}.`);
    lines.push("");
    lines.push("As seguintes avaliações foram registradas ou atualizadas hoje:");
    lines.push("");

    htmlSections.push(`<p>Olá, <strong>${escapeHtml(studentName)}</strong>.</p>`);
    htmlSections.push(
      "<p>As seguintes avaliações foram registradas ou atualizadas hoje:</p>"
    );

    for (const [classId, classEntries] of groupedByClass) {
      const className = classCache.get(classId) ?? `Turma ${classId}`;
      lines.push(`Turma: ${className}`);
      htmlSections.push(`<h3>${escapeHtml(className)}</h3>`);
      const items: string[] = [];
      for (const entry of classEntries) {
        const goalName = goalCache.get(entry.goalId) ?? `Meta ${entry.goalId}`;
        const fromLevel = entry.previousLevel
          ? `${entry.previousLevel} (${EVALUATION_LEVEL_LABELS[entry.previousLevel]})`
          : "—";
        const toLevel = `${entry.newLevel} (${EVALUATION_LEVEL_LABELS[entry.newLevel]})`;
        lines.push(`  • ${goalName}: ${fromLevel} → ${toLevel}`);
        items.push(
          `<li><strong>${escapeHtml(goalName)}</strong>: ${escapeHtml(fromLevel)} → ${escapeHtml(toLevel)}</li>`
        );
      }
      lines.push("");
      htmlSections.push(`<ul>${items.join("")}</ul>`);
    }

    lines.push("Em caso de dúvidas, fale com seu professor.");
    htmlSections.push("<p>Em caso de dúvidas, fale com seu professor.</p>");

    return {
      to,
      subject: `Resumo diário das suas avaliações — ${entries[0].digestDate}`,
      text: lines.join("\n"),
      html: htmlSections.join("\n")
    };
  }

  private buildEmailLog({
    studentId,
    studentName,
    status,
    message,
    entries,
    failureReason
  }: {
    studentId: string;
    studentName: string;
    status: EmailLog["status"];
    message: EmailMessage;
    entries: EmailDigestEntry[];
    failureReason?: string;
  }): EmailLog {
    return {
      id: randomUUID(),
      studentId,
      studentName,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      digestDate: entries[0]?.digestDate ?? formatDate(this.clock.now()),
      classIds: [...new Set(entries.map((entry) => entry.classId))],
      goalIds: [...new Set(entries.map((entry) => entry.goalId))],
      entriesCount: entries.length,
      status,
      attemptedAt: this.clock.now(),
      ...(failureReason ? { failureReason } : {})
    };
  }
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
