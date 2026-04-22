import { Request, Response } from "express";

import { GetExamArtifactDownloadUseCase } from "../../../application/use-cases/get-exam-artifact-download-use-case";
import { GetExamBatchUseCase } from "../../../application/use-cases/get-exam-batch-use-case";
import { ListExamTemplateBatchesUseCase } from "../../../application/use-cases/list-exam-template-batches-use-case";

const sanitizeDownloadFileName = (fileName: string): string =>
  fileName.replace(/[^A-Za-z0-9._-]/g, "_");

export class ExamBatchController {
  constructor(
    private readonly listExamTemplateBatchesUseCase: ListExamTemplateBatchesUseCase,
    private readonly getExamBatchUseCase: GetExamBatchUseCase,
    private readonly getExamArtifactDownloadUseCase: GetExamArtifactDownloadUseCase
  ) {}

  listByTemplate = async (request: Request, response: Response): Promise<void> => {
    const batches = await this.listExamTemplateBatchesUseCase.execute(request.params.id as string);
    response.status(200).json(batches);
  };

  getById = async (request: Request, response: Response): Promise<void> => {
    const batch = await this.getExamBatchUseCase.execute(request.params.batchId as string);
    response.status(200).json(batch);
  };

  downloadArtifact = async (request: Request, response: Response): Promise<void> => {
    const artifact = await this.getExamArtifactDownloadUseCase.execute(
      request.params.artifactId as string
    );

    response.setHeader("Content-Type", artifact.mimeType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizeDownloadFileName(artifact.fileName)}"`
    );
    response.status(200).send(artifact.content);
  };
}
