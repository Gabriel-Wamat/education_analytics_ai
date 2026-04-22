import {
  GeneratedArtifactKind as PrismaGeneratedArtifactKind,
  Prisma,
  PrismaClient
} from "@prisma/client";

import { ExamBatch } from "../../domain/entities/exam-batch";
import {
  ExamArtifact,
  StoredExamArtifact
} from "../../domain/entities/exam-artifact";
import {
  CreateExamBatchInput,
  IExamBatchRepository
} from "../../domain/repositories/exam-batch-repository";
import { GeneratedArtifactKind } from "../../domain/entities/generated-artifact";

type PrismaExamArtifactRecord = Prisma.ExamArtifactGetPayload<Record<string, never>>;
type PrismaExamBatchWithArtifacts = Prisma.ExamBatchGetPayload<{
  include: { artifacts: true };
}>;

const toDomainArtifact = (artifact: PrismaExamArtifactRecord): ExamArtifact => ({
  id: artifact.id,
  batchId: artifact.batchId,
  kind: artifact.kind as GeneratedArtifactKind,
  fileName: artifact.fileName,
  mimeType: artifact.mimeType,
  absolutePath: artifact.absolutePath ?? null,
  sizeInBytes: artifact.sizeInBytes,
  createdAt: artifact.createdAt
});

const toDomainStoredArtifact = (artifact: PrismaExamArtifactRecord): StoredExamArtifact => ({
  ...toDomainArtifact(artifact),
  content: Buffer.from(artifact.content)
});

const toDomainBatch = (batch: PrismaExamBatchWithArtifacts): ExamBatch => ({
  id: batch.id,
  templateId: batch.templateId,
  templateTitle: batch.templateTitle,
  quantity: batch.quantity,
  createdAt: batch.createdAt,
  artifacts: batch.artifacts
    .sort((left, right) => left.fileName.localeCompare(right.fileName))
    .map(toDomainArtifact)
});

export class PrismaExamBatchRepository implements IExamBatchRepository {
  private readonly initializationPromise: Promise<void>;

  constructor(private readonly prismaClient: PrismaClient) {
    this.initializationPromise = this.ensureSchema();
  }

  private async ensureSchema(): Promise<void> {
    await this.prismaClient.$executeRawUnsafe(`
      DO $$
      BEGIN
        CREATE TYPE "GeneratedArtifactKind" AS ENUM ('PDF', 'CSV');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await this.prismaClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "exam_batches" (
        "id" UUID NOT NULL,
        "templateId" UUID NOT NULL,
        "templateTitle" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "exam_batches_pkey" PRIMARY KEY ("id")
      );
    `);

    await this.prismaClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "exam_artifacts" (
        "id" UUID NOT NULL,
        "batchId" UUID NOT NULL,
        "kind" "GeneratedArtifactKind" NOT NULL,
        "fileName" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        "absolutePath" TEXT,
        "sizeInBytes" INTEGER NOT NULL,
        "content" BYTEA NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "exam_artifacts_pkey" PRIMARY KEY ("id")
      );
    `);

    await this.prismaClient.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "exam_batches_templateId_idx"
      ON "exam_batches"("templateId");
    `);

    await this.prismaClient.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "exam_artifacts_batchId_idx"
      ON "exam_artifacts"("batchId");
    `);

    await this.prismaClient.$executeRawUnsafe(`
      DO $$
      BEGIN
        ALTER TABLE "exam_batches"
        ADD CONSTRAINT "exam_batches_templateId_fkey"
        FOREIGN KEY ("templateId") REFERENCES "exam_templates"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await this.prismaClient.$executeRawUnsafe(`
      DO $$
      BEGIN
        ALTER TABLE "exam_artifacts"
        ADD CONSTRAINT "exam_artifacts_batchId_fkey"
        FOREIGN KEY ("batchId") REFERENCES "exam_batches"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  async create(input: CreateExamBatchInput): Promise<ExamBatch> {
    await this.initializationPromise;

    const batch = await this.prismaClient.examBatch.create({
      data: {
        id: input.id,
        templateTitle: input.templateTitle,
        quantity: input.quantity,
        createdAt: input.createdAt,
        examTemplate: {
          connect: {
            id: input.templateId
          }
        },
        artifacts: {
          create: input.artifacts.map((artifact) => ({
            id: artifact.id,
            kind: artifact.kind as PrismaGeneratedArtifactKind,
            fileName: artifact.fileName,
            mimeType: artifact.mimeType,
            absolutePath: artifact.absolutePath,
            sizeInBytes: artifact.sizeInBytes,
            content: Uint8Array.from(artifact.content),
            createdAt: artifact.createdAt
          }))
        }
      },
      include: {
        artifacts: true
      }
    });

    return toDomainBatch(batch as PrismaExamBatchWithArtifacts);
  }

  async findById(id: string): Promise<ExamBatch | null> {
    await this.initializationPromise;

    const batch = await this.prismaClient.examBatch.findUnique({
      where: { id },
      include: {
        artifacts: true
      }
    });

    return batch ? toDomainBatch(batch as PrismaExamBatchWithArtifacts) : null;
  }

  async findByTemplateId(templateId: string): Promise<ExamBatch[]> {
    await this.initializationPromise;

    const batches = await this.prismaClient.examBatch.findMany({
      where: { templateId },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        artifacts: true
      }
    });

    return batches.map((batch) => toDomainBatch(batch as PrismaExamBatchWithArtifacts));
  }

  async findArtifactById(id: string): Promise<StoredExamArtifact | null> {
    await this.initializationPromise;

    const artifact = await this.prismaClient.examArtifact.findUnique({
      where: { id }
    });

    return artifact ? toDomainStoredArtifact(artifact) : null;
  }
}
