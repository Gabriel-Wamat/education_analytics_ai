import {
  AlternativeIdentificationType as PrismaAlternativeIdentificationType,
  ExamInstance as PrismaExamInstance,
  Prisma,
  PrismaClient
} from "@prisma/client";
import { z } from "zod";

import { AlternativeIdentificationType } from "../../domain/entities/alternative-identification-type";
import {
  ExamInstance,
  ExamInstanceOption,
  ExamInstanceQuestion
} from "../../domain/entities/exam-instance";
import { IExamInstanceRepository } from "../../domain/repositories/exam-instance-repository";

const randomizedOptionSchema = z.object({
  originalOptionId: z.string().uuid(),
  position: z.number().int().positive(),
  description: z.string(),
  displayCode: z.string(),
  isCorrect: z.boolean()
});

const randomizedQuestionSchema = z.object({
  originalQuestionId: z.string().uuid(),
  position: z.number().int().positive(),
  statement: z.string(),
  randomizedOptions: z.array(randomizedOptionSchema)
});

const randomizedQuestionListSchema = z.array(randomizedQuestionSchema);

const toJsonValue = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const toDomainRandomizedQuestions = (value: Prisma.JsonValue): ExamInstanceQuestion[] =>
  randomizedQuestionListSchema.parse(value).map((question) => ({
    originalQuestionId: question.originalQuestionId,
    position: question.position,
    statement: question.statement,
    randomizedOptions: question.randomizedOptions.map(
      (option): ExamInstanceOption => ({
        originalOptionId: option.originalOptionId,
        position: option.position,
        description: option.description,
        displayCode: option.displayCode,
        isCorrect: option.isCorrect
      })
    )
  }));

const toDomainExamInstance = (examInstance: PrismaExamInstance): ExamInstance => ({
  id: examInstance.id,
  batchId: examInstance.batchId,
  examCode: examInstance.examCode,
  signature: examInstance.signature,
  templateId: examInstance.templateId,
  templateTitle: examInstance.templateTitle,
  alternativeIdentificationType:
    examInstance.alternativeIdentificationType as AlternativeIdentificationType,
  randomizedQuestions: toDomainRandomizedQuestions(examInstance.randomizedQuestions),
  createdAt: examInstance.createdAt,
  updatedAt: examInstance.updatedAt
});

export class PrismaExamInstanceRepository implements IExamInstanceRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async createMany(examInstances: ExamInstance[]): Promise<ExamInstance[]> {
    const persistedInstances = await this.prismaClient.$transaction(
      examInstances.map((examInstance) =>
        this.prismaClient.examInstance.create({
          data: {
            id: examInstance.id,
            batchId: examInstance.batchId,
            examCode: examInstance.examCode,
            signature: examInstance.signature,
            templateId: examInstance.templateId,
            templateTitle: examInstance.templateTitle,
            alternativeIdentificationType:
              examInstance.alternativeIdentificationType as PrismaAlternativeIdentificationType,
            randomizedQuestions: toJsonValue(examInstance.randomizedQuestions),
            createdAt: examInstance.createdAt,
            updatedAt: examInstance.updatedAt
          }
        })
      )
    );

    return persistedInstances.map(toDomainExamInstance);
  }

  async findById(id: string): Promise<ExamInstance | null> {
    const examInstance = await this.prismaClient.examInstance.findUnique({
      where: { id }
    });

    return examInstance ? toDomainExamInstance(examInstance) : null;
  }

  async findByExamCodes(examCodes: string[]): Promise<ExamInstance[]> {
    const examInstances = await this.prismaClient.examInstance.findMany({
      where: {
        examCode: {
          in: examCodes
        }
      }
    });

    return examInstances.map(toDomainExamInstance);
  }

  async findByBatchId(batchId: string): Promise<ExamInstance[]> {
    const examInstances = await this.prismaClient.examInstance.findMany({
      where: { batchId },
      orderBy: {
        createdAt: "asc"
      }
    });

    return examInstances.map(toDomainExamInstance);
  }

  async findByTemplateId(templateId: string): Promise<ExamInstance[]> {
    const examInstances = await this.prismaClient.examInstance.findMany({
      where: { templateId },
      orderBy: [
        {
          createdAt: "desc"
        },
        {
          examCode: "asc"
        }
      ]
    });

    return examInstances.map(toDomainExamInstance);
  }
}
