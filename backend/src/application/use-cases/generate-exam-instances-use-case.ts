import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { GenerateExamInstancesInput } from "../dto/generate-exam-instances-input";
import { ValidationError } from "../errors/validation-error";
import { NotFoundError } from "../errors/not-found-error";
import { buildExamArtifactDownloadUrl } from "../support/exam-artifact-download-url";
import {
  buildDerivedArtifactId
} from "../support/exam-batch-artifacts";
import { ICsvService } from "../services/csv-service";
import { IPdfGeneratorService } from "../services/pdf-generator-service";
import { ExamInstance } from "../../domain/entities/exam-instance";
import { createRandomizedExamInstance } from "../../domain/services/exam-instance-randomizer";
import { IExamInstanceRepository } from "../../domain/repositories/exam-instance-repository";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";

export interface GenerateExamInstancesResult {
  batchId: string;
  quantity: number;
  instances: ExamInstance[];
  artifacts: Array<{
    id: string;
    kind: "PDF" | "CSV";
    fileName: string;
    mimeType: string;
    absolutePath: string | null;
    sizeInBytes: number;
    createdAt: Date;
    downloadUrl: string;
  }>;
}

export class GenerateExamInstancesUseCase {
  constructor(
    private readonly examTemplateRepository: IExamTemplateRepository,
    private readonly examInstanceRepository: IExamInstanceRepository,
    private readonly pdfGeneratorService: IPdfGeneratorService,
    private readonly csvService: ICsvService,
    private readonly artifactsBaseDir: string
  ) {}

  private async readArtifactWithRetry(filePath: string): Promise<Buffer> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await fs.readFile(filePath);
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => {
          setTimeout(resolve, 25 * (attempt + 1));
        });
      }
    }

    throw lastError;
  }

  async execute(input: GenerateExamInstancesInput): Promise<GenerateExamInstancesResult> {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new ValidationError("A quantidade de provas deve ser um inteiro positivo.");
    }

    const examTemplate = await this.examTemplateRepository.findById(input.examTemplateId);
    if (!examTemplate) {
      throw new NotFoundError("Modelo de prova não encontrado.");
    }

    if (
      !examTemplate.headerMetadata ||
      examTemplate.headerMetadata.discipline.trim().length === 0 ||
      examTemplate.headerMetadata.teacher.trim().length === 0 ||
      examTemplate.headerMetadata.examDate.trim().length === 0
    ) {
      throw new ValidationError(
        "O modelo de prova precisa ter disciplina, professor e data antes da geração."
      );
    }

    const batchId = randomUUID();
    const maxAttempts = input.quantity * 20;
    const signatures = new Set<string>();
    const instances: ExamInstance[] = [];

    let attempts = 0;
    while (instances.length < input.quantity && attempts < maxAttempts) {
      const examCode = `${batchId.slice(0, 8).toUpperCase()}-${String(instances.length + 1).padStart(3, "0")}`;
      const { examInstance, signature } = createRandomizedExamInstance({
        batchId,
        examCode,
        examTemplate
      });

      if (!signatures.has(signature)) {
        signatures.add(signature);
        instances.push(examInstance);
      }

      attempts += 1;
    }

    if (instances.length !== input.quantity) {
      throw new ValidationError(
        "Não foi possível gerar a quantidade solicitada de provas únicas dentro do limite de tentativas."
      );
    }

    const persistedInstances = await this.examInstanceRepository.createMany(instances);
    const outputDir = path.resolve(this.artifactsBaseDir, batchId);
    const pdfArtifacts = await this.pdfGeneratorService.generateExamPdfs(
      batchId,
      examTemplate,
      persistedInstances,
      outputDir
    );
    const answerKeyArtifact = await this.csvService.generateAnswerKeyCsv(
      batchId,
      persistedInstances,
      outputDir
    );
    const artifactPayload = await Promise.all(
      [
        ...pdfArtifacts.map((artifact, index) => ({
          artifact,
          artifactId: buildDerivedArtifactId({
            kind: "PDF",
            batchId,
            instanceId: persistedInstances[index]?.id
          })
        })),
        {
          artifact: answerKeyArtifact,
          artifactId: buildDerivedArtifactId({
            kind: "CSV",
            batchId
          })
        }
      ].map(async ({ artifact, artifactId }) => {
        const content = await this.readArtifactWithRetry(artifact.absolutePath);

        return {
          id: artifactId,
          kind: artifact.kind,
          fileName: artifact.fileName,
          mimeType: artifact.mimeType,
          absolutePath: null,
          sizeInBytes: content.byteLength,
          createdAt: new Date(),
          downloadUrl: buildExamArtifactDownloadUrl(artifactId)
        };
      })
    );
    await fs.rm(outputDir, { recursive: true, force: true });

    return {
      batchId,
      quantity: persistedInstances.length,
      instances: persistedInstances,
      artifacts: artifactPayload
    };
  }
}
