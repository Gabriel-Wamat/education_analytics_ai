import { NotFoundError } from "../errors/not-found-error";
import {
  buildCsvArtifactFileName,
  buildDerivedArtifactId,
  buildPdfArtifactFileName,
  sortInstancesByExamCode
} from "../support/exam-batch-artifacts";
import { buildExamArtifactDownloadUrl } from "../support/exam-artifact-download-url";
import { IExamInstanceRepository } from "../../domain/repositories/exam-instance-repository";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";

export interface ExamBatchSummaryResult {
  id: string;
  templateId: string;
  templateTitle: string;
  quantity: number;
  createdAt: Date;
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

export class ListExamTemplateBatchesUseCase {
  constructor(
    private readonly examTemplateRepository: IExamTemplateRepository,
    private readonly examInstanceRepository: IExamInstanceRepository
  ) {}

  async execute(examTemplateId: string): Promise<ExamBatchSummaryResult[]> {
    const template = await this.examTemplateRepository.findById(examTemplateId);
    if (!template) {
      throw new NotFoundError("Modelo de prova não encontrado.");
    }

    const instances = await this.examInstanceRepository.findByTemplateId(examTemplateId);
    const grouped = new Map<string, typeof instances>();

    for (const instance of instances) {
      const current = grouped.get(instance.batchId) ?? [];
      current.push(instance);
      grouped.set(instance.batchId, current);
    }

    return [...grouped.entries()]
      .map(([batchId, batchInstances]) => {
        const sortedInstances = sortInstancesByExamCode(batchInstances);
        const createdAt = [...batchInstances].sort(
          (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
        )[0]?.createdAt ?? new Date();

        const artifacts = [
          {
            id: buildDerivedArtifactId({
              kind: "CSV",
              batchId
            }),
            kind: "CSV" as const,
            fileName: buildCsvArtifactFileName(batchId),
            mimeType: "text/csv",
            absolutePath: null,
            sizeInBytes: 0,
            createdAt,
            downloadUrl: buildExamArtifactDownloadUrl(
              buildDerivedArtifactId({
                kind: "CSV",
                batchId
              })
            )
          },
          ...sortedInstances.map((instance) => {
            const artifactId = buildDerivedArtifactId({
              kind: "PDF",
              batchId,
              instanceId: instance.id
            });

            return {
              id: artifactId,
              kind: "PDF" as const,
              fileName: buildPdfArtifactFileName(instance.examCode),
              mimeType: "application/pdf",
              absolutePath: null,
              sizeInBytes: 0,
              createdAt: instance.createdAt,
              downloadUrl: buildExamArtifactDownloadUrl(artifactId)
            };
          })
        ];

        return {
          id: batchId,
          templateId: examTemplateId,
          templateTitle: template.title,
          quantity: batchInstances.length,
          createdAt,
          artifacts
        };
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }
}
