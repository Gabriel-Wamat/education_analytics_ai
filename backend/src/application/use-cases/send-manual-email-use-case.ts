import crypto from "node:crypto";

import { IClock } from "../services/clock";
import { IEmailService } from "../services/email-service";
import { ValidationError } from "../errors/validation-error";
import { NotFoundError } from "../errors/not-found-error";
import { EmailLog } from "../../domain/entities/email-log";
import { Student } from "../../domain/entities/student";
import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";
import { IEmailLogRepository } from "../../domain/repositories/email-log-repository";
import { IStudentRepository } from "../../domain/repositories/student-repository";

export type ManualEmailScope = "STUDENT" | "CLASS";

export interface SendManualEmailInput {
  scope: ManualEmailScope;
  studentId?: string;
  classId?: string;
  subject: string;
  text: string;
}

export interface ManualEmailRecipientResult {
  studentId: string;
  studentName: string;
  studentEmail: string;
  sent: boolean;
  error?: string;
}

export interface SendManualEmailResult {
  scope: ManualEmailScope;
  targetLabel: string;
  totalRecipients: number;
  emailsSent: number;
  emailsFailed: number;
  recipients: ManualEmailRecipientResult[];
}

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

export class SendManualEmailUseCase {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly classGroupRepository: IClassGroupRepository,
    private readonly emailLogRepository: IEmailLogRepository,
    private readonly emailService: IEmailService,
    private readonly clock: IClock
  ) {}

  async execute(input: SendManualEmailInput): Promise<SendManualEmailResult> {
    const subject = input.subject.trim();
    const text = input.text.trim();

    if (subject.length === 0) {
      throw new ValidationError("O assunto do e-mail é obrigatório.");
    }

    if (text.length === 0) {
      throw new ValidationError("O corpo do e-mail é obrigatório.");
    }

    const { students, classIds, targetLabel } = await this.resolveRecipients(input);
    if (students.length === 0) {
      throw new ValidationError("Não há alunos com e-mail para receber esta mensagem.");
    }

    const result: SendManualEmailResult = {
      scope: input.scope,
      targetLabel,
      totalRecipients: students.length,
      emailsSent: 0,
      emailsFailed: 0,
      recipients: []
    };

    for (const student of students) {
      const attemptedAt = this.clock.now();
      try {
        await this.emailService.send({
          to: student.email,
          subject,
          text,
          html: this.toSimpleHtml(text)
        });
        await this.emailLogRepository.create(
          this.buildEmailLog({
            student,
            subject,
            text,
            classIds,
            attemptedAt,
            status: "sent"
          })
        );
        result.emailsSent += 1;
        result.recipients.push({
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          sent: true
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Falha ao enviar e-mail.";
        await this.emailLogRepository.create(
          this.buildEmailLog({
            student,
            subject,
            text,
            classIds,
            attemptedAt,
            status: "failed",
            failureReason: reason
          })
        );
        result.emailsFailed += 1;
        result.recipients.push({
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          sent: false,
          error: reason
        });
      }
    }

    return result;
  }

  private async resolveRecipients(input: SendManualEmailInput): Promise<{
    students: Student[];
    classIds: string[];
    targetLabel: string;
  }> {
    if (input.scope === "STUDENT") {
      if (!input.studentId) {
        throw new ValidationError("Informe o aluno que receberá o e-mail.");
      }
      const student = await this.studentRepository.findById(input.studentId);
      if (!student) {
        throw new NotFoundError("Aluno não encontrado.");
      }
      return {
        students: [student],
        classIds: [],
        targetLabel: student.name
      };
    }

    if (!input.classId) {
      throw new ValidationError("Informe a turma que receberá o e-mail.");
    }

    const classGroup = await this.classGroupRepository.findById(input.classId);
    if (!classGroup) {
      throw new NotFoundError("Turma não encontrada.");
    }

    const students = await this.studentRepository.findByIds(classGroup.studentIds);
    return {
      students: classGroup.studentIds
        .map((studentId) => students.find((student) => student.id === studentId))
        .filter((student): student is Student => Boolean(student)),
      classIds: [classGroup.id],
      targetLabel: classGroup.topic
    };
  }

  private buildEmailLog(input: {
    student: Student;
    subject: string;
    text: string;
    classIds: string[];
    attemptedAt: Date;
    status: EmailLog["status"];
    failureReason?: string;
  }): EmailLog {
    return {
      id: crypto.randomUUID(),
      studentId: input.student.id,
      studentName: input.student.name,
      to: input.student.email,
      subject: input.subject,
      text: input.text,
      html: this.toSimpleHtml(input.text),
      digestDate: formatDate(input.attemptedAt),
      classIds: input.classIds,
      goalIds: [],
      entriesCount: 1,
      status: input.status,
      attemptedAt: input.attemptedAt,
      ...(input.failureReason ? { failureReason: input.failureReason } : {})
    };
  }

  private toSimpleHtml(text: string): string {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped
      .split(/\r?\n/)
      .map((line) => `<p>${line || "&nbsp;"}</p>`)
      .join("");
  }
}
