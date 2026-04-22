import {
  buildDisplayAnswer,
  buildExpectedStates,
} from "../../domain/services/answer-normalizer";
import {
  buildCsvArtifactFileName,
  buildDerivedArtifactId,
  buildPdfArtifactFileName,
  sortInstancesByExamCode
} from "../support/exam-batch-artifacts";
import { NotFoundError } from "../errors/not-found-error";
import { buildExamArtifactDownloadUrl } from "../support/exam-artifact-download-url";
import { IExamInstanceRepository } from "../../domain/repositories/exam-instance-repository";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";

export interface ExamBatchDetailResult {
  id: string;
  templateId: string;
  templateTitle: string;
  quantity: number;
  createdAt: Date;
  headerMetadata: {
    discipline: string;
    teacher: string;
    examDate: string;
  } | null;
  alternativeIdentificationType: "LETTERS" | "POWERS_OF_2";
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
  instances: Array<{
    id: string;
    examCode: string;
    createdAt: Date;
    answerKey: string[];
    questionCount: number;
    questions: Array<{
      position: number;
      statement: string;
      answer: string;
      options: Array<{
        position: number;
        displayCode: string;
        description: string;
        isCorrect: boolean;
      }>;
    }>;
  }>;
}

export class GetExamBatchUseCase {
  constructor(
    private readonly examInstanceRepository: IExamInstanceRepository,
    private readonly examTemplateRepository: IExamTemplateRepository
  ) {}

  async execute(batchId: string): Promise<ExamBatchDetailResult> {
    const instances = await this.examInstanceRepository.findByBatchId(batchId);
    if (instances.length === 0) {
      throw new NotFoundError("Lote de provas não encontrado.");
    }

    const firstInstance = instances[0]!;
    const template = await this.examTemplateRepository.findById(firstInstance.templateId);

    if (!template) {
      throw new NotFoundError("Modelo de prova não encontrado.");
    }

    const sortedInstances = sortInstancesByExamCode(instances);
    const createdAt = [...instances].sort(
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
      templateId: firstInstance.templateId,
      templateTitle: firstInstance.templateTitle,
      quantity: instances.length,
      createdAt,
      headerMetadata: template.headerMetadata,
      alternativeIdentificationType: template.alternativeIdentificationType,
      artifacts,
      instances: sortedInstances.map((instance) => {
        const orderedQuestions = [...instance.randomizedQuestions].sort(
          (left, right) => left.position - right.position
        );

        return {
          id: instance.id,
          examCode: instance.examCode,
          createdAt: instance.createdAt,
          answerKey: orderedQuestions.map((question) =>
            buildDisplayAnswer(
              buildExpectedStates(question),
              question,
              instance.alternativeIdentificationType
            )
          ),
          questionCount: orderedQuestions.length,
          questions: orderedQuestions.map((question) => ({
            position: question.position,
            statement: question.statement,
            answer: buildDisplayAnswer(
              buildExpectedStates(question),
              question,
              instance.alternativeIdentificationType
            ),
            options: [...question.randomizedOptions]
              .sort((left, right) => left.position - right.position)
              .map((option) => ({
                position: option.position,
                displayCode: option.displayCode,
                description: option.description,
                isCorrect: option.isCorrect
              }))
          }))
        };
      })
    };
  }
}
