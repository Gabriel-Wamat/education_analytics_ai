import { Request, Response } from "express";

import { GetExamArtifactDownloadUseCase } from "../../../application/use-cases/get-exam-artifact-download-use-case";
import { GetExamBatchUseCase } from "../../../application/use-cases/get-exam-batch-use-case";
import { ListExamTemplateBatchesUseCase } from "../../../application/use-cases/list-exam-template-batches-use-case";
import { SendExamBatchToClassUseCase } from "../../../application/use-cases/send-exam-batch-to-class-use-case";

const sanitizeDownloadFileName = (fileName: string): string =>
  fileName.replace(/[^A-Za-z0-9._-]/g, "_");

export class ExamBatchController {
  constructor(
    private readonly listExamTemplateBatchesUseCase: ListExamTemplateBatchesUseCase,
    private readonly getExamBatchUseCase: GetExamBatchUseCase,
    private readonly getExamArtifactDownloadUseCase: GetExamArtifactDownloadUseCase,
    private readonly sendExamBatchToClassUseCase: SendExamBatchToClassUseCase
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

  sendToClass = async (request: Request, response: Response): Promise<void> => {
    const result = await this.sendExamBatchToClassUseCase.execute({
      batchId: request.params.batchId as string,
      classId: request.body.classId as string,
      baseUrl: resolveRequestBaseUrl(request)
    });

    response.status(200).json(result);
  };
}

const resolveRequestBaseUrl = (request: Request): string => {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const forwardedHost = request.headers["x-forwarded-host"];
  const protocol =
    typeof forwardedProto === "string"
      ? forwardedProto.split(",")[0]!.trim()
      : request.protocol ?? "https";
  const host =
    typeof forwardedHost === "string"
      ? forwardedHost.split(",")[0]!.trim()
      : request.get("host");

  if (host) {
    return `${protocol}://${host}`;
  }

  if (process.env.PUBLIC_APP_URL) {
    return process.env.PUBLIC_APP_URL;
  }

  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
};
