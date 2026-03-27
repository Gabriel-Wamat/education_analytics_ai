import { Prisma, PrismaClient, ExamTemplate as PrismaExamTemplate } from "@prisma/client";
import { z } from "zod";

import { AlternativeIdentificationType } from "../../domain/entities/alternative-identification-type";
import { ExamHeaderMetadata } from "../../domain/entities/exam-header-metadata";
import { ExamTemplate } from "../../domain/entities/exam-template";
import { Question } from "../../domain/entities/question";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";

const headerMetadataSchema = z.object({
  discipline: z.string(),
  teacher: z.string(),
  examDate: z.string()
});

const snapshotOptionSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  isCorrect: z.boolean()
});

const snapshotQuestionSchema = z.object({
  id: z.string().uuid(),
  topic: z.string().optional().default("Tema geral"),
  unit: z.number().int().min(1).optional().default(1),
  statement: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  options: z.array(snapshotOptionSchema)
});

const snapshotQuestionListSchema = z.array(snapshotQuestionSchema);

const toHeaderMetadataJson = (
  headerMetadata: ExamHeaderMetadata | null
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =>
  headerMetadata
    ? (JSON.parse(JSON.stringify(headerMetadata)) as Prisma.InputJsonValue)
    : Prisma.JsonNull;

const toSnapshotJson = (questionsSnapshot: Question[]): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(questionsSnapshot)) as Prisma.InputJsonValue;

const toDomainHeaderMetadata = (
  headerMetadata: Prisma.JsonValue | null
): ExamHeaderMetadata | null =>
  headerMetadata ? headerMetadataSchema.parse(headerMetadata) : null;

const toDomainQuestionsSnapshot = (questionsSnapshot: Prisma.JsonValue): Question[] =>
  snapshotQuestionListSchema.parse(questionsSnapshot).map((question) => ({
    id: question.id,
    topic: question.topic,
    unit: question.unit,
    statement: question.statement,
    createdAt: new Date(question.createdAt),
    updatedAt: new Date(question.updatedAt),
    options: question.options.map((option) => ({
      id: option.id,
      description: option.description,
      isCorrect: option.isCorrect
    }))
  }));

const toDomainExamTemplate = (examTemplate: PrismaExamTemplate): ExamTemplate => ({
  id: examTemplate.id,
  title: examTemplate.title,
  headerMetadata: toDomainHeaderMetadata(examTemplate.headerMetadata),
  alternativeIdentificationType:
    examTemplate.alternativeIdentificationType as AlternativeIdentificationType,
  questionsSnapshot: toDomainQuestionsSnapshot(examTemplate.questionsSnapshot),
  createdAt: examTemplate.createdAt,
  updatedAt: examTemplate.updatedAt
});

export class PrismaExamTemplateRepository implements IExamTemplateRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(examTemplate: ExamTemplate): Promise<ExamTemplate> {
    const createdExamTemplate = await this.prismaClient.examTemplate.create({
      data: {
        id: examTemplate.id,
        title: examTemplate.title,
        headerMetadata: toHeaderMetadataJson(examTemplate.headerMetadata),
        alternativeIdentificationType: examTemplate.alternativeIdentificationType,
        questionsSnapshot: toSnapshotJson(examTemplate.questionsSnapshot),
        createdAt: examTemplate.createdAt,
        updatedAt: examTemplate.updatedAt
      }
    });

    return toDomainExamTemplate(createdExamTemplate);
  }

  async findAll(): Promise<ExamTemplate[]> {
    const examTemplates = await this.prismaClient.examTemplate.findMany({
      orderBy: {
        createdAt: "asc"
      }
    });

    return examTemplates.map(toDomainExamTemplate);
  }

  async findById(id: string): Promise<ExamTemplate | null> {
    const examTemplate = await this.prismaClient.examTemplate.findUnique({
      where: { id }
    });

    return examTemplate ? toDomainExamTemplate(examTemplate) : null;
  }

  async update(examTemplate: ExamTemplate): Promise<ExamTemplate> {
    const updatedExamTemplate = await this.prismaClient.examTemplate.update({
      where: { id: examTemplate.id },
      data: {
        title: examTemplate.title,
        headerMetadata: toHeaderMetadataJson(examTemplate.headerMetadata),
        alternativeIdentificationType: examTemplate.alternativeIdentificationType,
        questionsSnapshot: toSnapshotJson(examTemplate.questionsSnapshot),
        updatedAt: examTemplate.updatedAt
      }
    });

    return toDomainExamTemplate(updatedExamTemplate);
  }

  async delete(id: string): Promise<void> {
    await this.prismaClient.$transaction(async (transactionClient) => {
      await transactionClient.examReport.deleteMany({
        where: { templateId: id }
      });
      await transactionClient.examInstance.deleteMany({
        where: { templateId: id }
      });
      await transactionClient.examTemplate.delete({
        where: { id }
      });
    });
  }
}
