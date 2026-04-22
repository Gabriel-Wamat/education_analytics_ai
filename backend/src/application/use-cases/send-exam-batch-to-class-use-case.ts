import { randomUUID } from "node:crypto";

import { EmailLog } from "../../domain/entities/email-log";
import { ClassGroup } from "../../domain/entities/class-group";
import { ExamTemplate } from "../../domain/entities/exam-template";
import { Student } from "../../domain/entities/student";
import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";
import { IEmailLogRepository } from "../../domain/repositories/email-log-repository";
import { IExamInstanceRepository } from "../../domain/repositories/exam-instance-repository";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";
import { IStudentRepository } from "../../domain/repositories/student-repository";
import { NotFoundError } from "../errors/not-found-error";
import { ValidationError } from "../errors/validation-error";
import { IClock, SystemClock } from "../services/clock";
import { EmailMessage, IEmailService } from "../services/email-service";
import { buildDerivedArtifactId, sortInstancesByExamCode } from "../support/exam-batch-artifacts";
import { buildExamArtifactDownloadUrl } from "../support/exam-artifact-download-url";

export interface SendExamBatchToClassResult {
  batchId: string;
  classId: string;
  classLabel: string;
  studentsTargeted: number;
  proofsAvailable: number;
  emailsSent: number;
  emailsFailed: number;
  assignments: Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    examCode: string;
    artifactId: string;
    downloadUrl: string;
    sent: boolean;
    error?: string;
  }>;
}

interface ExecuteInput {
  batchId: string;
  classId: string;
  baseUrl: string;
}

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

const buildClassLabel = (classGroup: ClassGroup): string =>
  `${classGroup.topic} (${classGroup.year}.${classGroup.semester})`;

const absoluteUrl = (baseUrl: string, relativePath: string): string =>
  new URL(relativePath, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();

export class SendExamBatchToClassUseCase {
  constructor(
    private readonly examInstanceRepository: IExamInstanceRepository,
    private readonly examTemplateRepository: IExamTemplateRepository,
    private readonly classGroupRepository: IClassGroupRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly emailLogRepository: IEmailLogRepository,
    private readonly emailService: IEmailService,
    private readonly clock: IClock = new SystemClock()
  ) {}

  async execute(input: ExecuteInput): Promise<SendExamBatchToClassResult> {
    const classGroup = await this.classGroupRepository.findById(input.classId);
    if (!classGroup) {
      throw new NotFoundError("Turma não encontrada.");
    }

    const sortedInstances = sortInstancesByExamCode(
      await this.examInstanceRepository.findByBatchId(input.batchId)
    );
    if (sortedInstances.length === 0) {
      throw new NotFoundError("Lote de provas não encontrado.");
    }

    if (classGroup.studentIds.length === 0) {
      throw new ValidationError("A turma selecionada não possui alunos matriculados.");
    }

    if (sortedInstances.length < classGroup.studentIds.length) {
      throw new ValidationError(
        "O lote gerado não possui provas suficientes para todos os alunos da turma.",
        [
          `Alunos na turma: ${classGroup.studentIds.length}.`,
          `Provas disponíveis no lote: ${sortedInstances.length}.`
        ]
      );
    }

    const students = await this.resolveStudentsInClassOrder(classGroup.studentIds);
    const template = await this.examTemplateRepository.findById(sortedInstances[0]!.templateId);

    const result: SendExamBatchToClassResult = {
      batchId: input.batchId,
      classId: classGroup.id,
      classLabel: buildClassLabel(classGroup),
      studentsTargeted: students.length,
      proofsAvailable: sortedInstances.length,
      emailsSent: 0,
      emailsFailed: 0,
      assignments: []
    };

    for (const [index, student] of students.entries()) {
      const assignedInstance = sortedInstances[index]!;
      const artifactId = buildDerivedArtifactId({
        kind: "PDF",
        batchId: input.batchId,
        instanceId: assignedInstance.id
      });
      const downloadUrl = absoluteUrl(input.baseUrl, buildExamArtifactDownloadUrl(artifactId));
      const message = this.composeMessage({
        student,
        classGroup,
        template,
        examCode: assignedInstance.examCode,
        downloadUrl
      });

      try {
        await this.emailService.send(message);
        await this.emailLogRepository.create(
          this.buildEmailLog({
            student,
            classGroup,
            message,
            status: "sent"
          })
        );

        result.emailsSent += 1;
        result.assignments.push({
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          examCode: assignedInstance.examCode,
          artifactId,
          downloadUrl,
          sent: true
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Falha ao enviar email.";
        await this.emailLogRepository.create(
          this.buildEmailLog({
            student,
            classGroup,
            message,
            status: "failed",
            failureReason: reason
          })
        );

        result.emailsFailed += 1;
        result.assignments.push({
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          examCode: assignedInstance.examCode,
          artifactId,
          downloadUrl,
          sent: false,
          error: reason
        });
      }
    }

    return result;
  }

  private async resolveStudentsInClassOrder(studentIds: string[]): Promise<Student[]> {
    const students = await this.studentRepository.findByIds(studentIds);
    const studentsById = new Map(students.map((student) => [student.id, student]));

    return studentIds.map((studentId) => {
      const student = studentsById.get(studentId);
      if (!student) {
        throw new ValidationError(
          "A turma contém referências inválidas de alunos.",
          [`Aluno ${studentId} não foi encontrado no cadastro.`]
        );
      }

      return student;
    });
  }

  private composeMessage({
    student,
    classGroup,
    template,
    examCode,
    downloadUrl
  }: {
    student: Student;
    classGroup: ClassGroup;
    template: ExamTemplate | null;
    examCode: string;
    downloadUrl: string;
  }): EmailMessage {
    const title = template?.title ?? "Prova disponível";
    const discipline = template?.headerMetadata?.discipline;
    const teacher = template?.headerMetadata?.teacher;
    const examDate = template?.headerMetadata?.examDate;

    const textLines = [
      `Olá, ${student.name}.`,
      "",
      `Sua prova da turma ${buildClassLabel(classGroup)} já está disponível.`,
      `Título: ${title}`,
      ...(discipline ? [`Disciplina: ${discipline}`] : []),
      ...(teacher ? [`Professor: ${teacher}`] : []),
      ...(examDate ? [`Data da prova: ${examDate}`] : []),
      `Código da prova: ${examCode}`,
      "",
      `Acesse o PDF individual neste link: ${downloadUrl}`,
      "",
      "Boa prova."
    ];

    const htmlLines = [
      `<p>Olá, <strong>${escapeHtml(student.name)}</strong>.</p>`,
      `<p>Sua prova da turma <strong>${escapeHtml(buildClassLabel(classGroup))}</strong> já está disponível.</p>`,
      "<ul>",
      `<li><strong>Título:</strong> ${escapeHtml(title)}</li>`,
      ...(discipline ? [`<li><strong>Disciplina:</strong> ${escapeHtml(discipline)}</li>`] : []),
      ...(teacher ? [`<li><strong>Professor:</strong> ${escapeHtml(teacher)}</li>`] : []),
      ...(examDate ? [`<li><strong>Data da prova:</strong> ${escapeHtml(examDate)}</li>`] : []),
      `<li><strong>Código da prova:</strong> ${escapeHtml(examCode)}</li>`,
      "</ul>",
      `<p><a href="${escapeHtml(downloadUrl)}">Clique aqui para baixar seu PDF individual</a>.</p>`,
      "<p>Boa prova.</p>"
    ];

    return {
      to: student.email,
      subject: `Prova disponível — ${title} — ${examCode}`,
      text: textLines.join("\n"),
      html: htmlLines.join("\n")
    };
  }

  private buildEmailLog({
    student,
    classGroup,
    message,
    status,
    failureReason
  }: {
    student: Student;
    classGroup: ClassGroup;
    message: EmailMessage;
    status: EmailLog["status"];
    failureReason?: string;
  }): EmailLog {
    return {
      id: randomUUID(),
      studentId: student.id,
      studentName: student.name,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      digestDate: formatDate(this.clock.now()),
      classIds: [classGroup.id],
      goalIds: [],
      entriesCount: 1,
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
