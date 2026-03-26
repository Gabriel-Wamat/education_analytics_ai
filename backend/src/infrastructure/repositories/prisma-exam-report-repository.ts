import {
  ExamReport as PrismaExamReport,
  GradingStrategyType as PrismaGradingStrategyType,
  Prisma,
  PrismaClient
} from "@prisma/client";
import { z } from "zod";

import {
  ExamReport,
  ExamReportQuestionResult,
  ExamReportStudentResult
} from "../../domain/entities/exam-report";
import { GradingStrategyType } from "../../domain/entities/grading-strategy-type";
import { IExamReportRepository } from "../../domain/repositories/exam-report-repository";

const examReportQuestionResultSchema = z.object({
  originalQuestionId: z.string().uuid(),
  questionPositionInTemplate: z.number().int().positive(),
  expectedAnswer: z.string(),
  actualAnswer: z.string(),
  score: z.number(),
  selectedOptionIds: z.array(z.string().uuid()),
  wasFullyCorrect: z.boolean()
});

const examReportStudentResultSchema = z.object({
  studentId: z.string(),
  studentName: z.string().optional(),
  examCode: z.string(),
  totalScore: z.number(),
  percentage: z.number(),
  questionResults: z.array(examReportQuestionResultSchema)
});

const examReportStudentListSchema = z.array(examReportStudentResultSchema);

const toJsonValue = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const toDomainStudentsSnapshot = (value: Prisma.JsonValue): ExamReportStudentResult[] =>
  examReportStudentListSchema.parse(value).map((student) => ({
    studentId: student.studentId,
    studentName: student.studentName,
    examCode: student.examCode,
    totalScore: student.totalScore,
    percentage: student.percentage,
    questionResults: student.questionResults.map(
      (questionResult): ExamReportQuestionResult => ({
        originalQuestionId: questionResult.originalQuestionId,
        questionPositionInTemplate: questionResult.questionPositionInTemplate,
        expectedAnswer: questionResult.expectedAnswer,
        actualAnswer: questionResult.actualAnswer,
        score: questionResult.score,
        selectedOptionIds: questionResult.selectedOptionIds,
        wasFullyCorrect: questionResult.wasFullyCorrect
      })
    )
  }));

const toDomainExamReport = (examReport: PrismaExamReport): ExamReport => ({
  id: examReport.id,
  batchId: examReport.batchId,
  templateId: examReport.templateId,
  templateTitle: examReport.templateTitle,
  gradingStrategyType: examReport.gradingStrategyType as GradingStrategyType,
  studentsSnapshot: toDomainStudentsSnapshot(examReport.studentsSnapshot),
  createdAt: examReport.createdAt,
  updatedAt: examReport.updatedAt
});

export class PrismaExamReportRepository implements IExamReportRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(examReport: ExamReport): Promise<ExamReport> {
    const createdExamReport = await this.prismaClient.examReport.create({
      data: {
        id: examReport.id,
        batchId: examReport.batchId,
        templateId: examReport.templateId,
        templateTitle: examReport.templateTitle,
        gradingStrategyType:
          examReport.gradingStrategyType as PrismaGradingStrategyType,
        studentsSnapshot: toJsonValue(examReport.studentsSnapshot),
        createdAt: examReport.createdAt,
        updatedAt: examReport.updatedAt
      }
    });

    return toDomainExamReport(createdExamReport);
  }

  async findById(id: string): Promise<ExamReport | null> {
    const examReport = await this.prismaClient.examReport.findUnique({
      where: { id }
    });

    return examReport ? toDomainExamReport(examReport) : null;
  }
}
