import path from "node:path";
import { randomUUID } from "node:crypto";

import { GenerateExamInstancesInput } from "../dto/generate-exam-instances-input";
import { ValidationError } from "../errors/validation-error";
import { NotFoundError } from "../errors/not-found-error";
import { ICsvService } from "../services/csv-service";
import { IPdfGeneratorService } from "../services/pdf-generator-service";
import { ExamInstance } from "../../domain/entities/exam-instance";
import { GeneratedArtifact } from "../../domain/entities/generated-artifact";
import { createRandomizedExamInstance } from "../../domain/services/exam-instance-randomizer";
import { IExamInstanceRepository } from "../../domain/repositories/exam-instance-repository";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";

export interface GenerateExamInstancesResult {
  batchId: string;
  quantity: number;
  instances: ExamInstance[];
  artifacts: GeneratedArtifact[];
}

export class GenerateExamInstancesUseCase {
  constructor(
    private readonly examTemplateRepository: IExamTemplateRepository,
    private readonly examInstanceRepository: IExamInstanceRepository,
    private readonly pdfGeneratorService: IPdfGeneratorService,
    private readonly csvService: ICsvService,
    private readonly artifactsBaseDir: string
  ) {}

  async execute(input: GenerateExamInstancesInput): Promise<GenerateExamInstancesResult> {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new ValidationError("A quantidade de provas deve ser um inteiro positivo.");
    }

    const examTemplate = await this.examTemplateRepository.findById(input.examTemplateId);
    if (!examTemplate) {
      throw new NotFoundError("Modelo de prova não encontrado.");
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
      persistedInstances,
      outputDir
    );
    const answerKeyArtifact = await this.csvService.generateAnswerKeyCsv(
      batchId,
      persistedInstances,
      outputDir
    );

    return {
      batchId,
      quantity: persistedInstances.length,
      instances: persistedInstances,
      artifacts: [...pdfArtifacts, answerKeyArtifact]
    };
  }
}
