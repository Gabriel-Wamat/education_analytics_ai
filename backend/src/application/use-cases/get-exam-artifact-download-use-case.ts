import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NotFoundError } from "../errors/not-found-error";
import { ValidationError } from "../errors/validation-error";
import { ICsvService } from "../services/csv-service";
import { IPdfGeneratorService } from "../services/pdf-generator-service";
import {
  parseDerivedArtifactId,
  buildCsvArtifactFileName,
  buildPdfArtifactFileName
} from "../support/exam-batch-artifacts";
import { IExamInstanceRepository } from "../../domain/repositories/exam-instance-repository";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";

export interface ExamArtifactDownloadResult {
  id: string;
  fileName: string;
  mimeType: string;
  content: Buffer;
}

export class GetExamArtifactDownloadUseCase {
  constructor(
    private readonly examInstanceRepository: IExamInstanceRepository,
    private readonly examTemplateRepository: IExamTemplateRepository,
    private readonly pdfGeneratorService: IPdfGeneratorService,
    private readonly csvService: ICsvService,
    private readonly artifactsBaseDir: string
  ) {}

  async execute(artifactId: string): Promise<ExamArtifactDownloadResult> {
    let parsed;
    try {
      parsed = parseDerivedArtifactId(artifactId);
    } catch {
      throw new ValidationError("Artefato não encontrado.");
    }

    const outputDir = path.resolve(this.artifactsBaseDir, "downloads", parsed.batchId, randomUUID());
    await fs.mkdir(outputDir, { recursive: true });

    try {
      if (parsed.kind === "CSV") {
        const instances = await this.examInstanceRepository.findByBatchId(parsed.batchId);
        if (instances.length === 0) {
          throw new NotFoundError("Lote de provas não encontrado.");
        }

        const artifact = await this.csvService.generateAnswerKeyCsv(parsed.batchId, instances, outputDir);
        const content = await fs.readFile(artifact.absolutePath);

        return {
          id: artifactId,
          fileName: buildCsvArtifactFileName(parsed.batchId),
          mimeType: artifact.mimeType,
          content
        };
      }

      const instance = await this.examInstanceRepository.findById(parsed.instanceId!);
      if (!instance || instance.batchId !== parsed.batchId) {
        throw new NotFoundError("Prova individual não encontrada.");
      }

      const template = await this.examTemplateRepository.findById(instance.templateId);
      if (!template) {
        throw new NotFoundError("Modelo de prova não encontrado.");
      }

      const artifacts = await this.pdfGeneratorService.generateExamPdfs(
        parsed.batchId,
        template,
        [instance],
        outputDir
      );
      const artifact = artifacts[0];
      if (!artifact) {
        throw new NotFoundError("Artefato não encontrado.");
      }
      const content = await fs.readFile(artifact.absolutePath);

      return {
        id: artifactId,
        fileName: buildPdfArtifactFileName(instance.examCode),
        mimeType: artifact.mimeType,
        content
      };
    } finally {
      await fs.rm(outputDir, { recursive: true, force: true });
    }
  }
}
