import { ExamInstance } from "../../domain/entities/exam-instance";

export type DerivedArtifactKind = "PDF" | "CSV";

export interface DerivedArtifactRef {
  kind: DerivedArtifactKind;
  batchId: string;
  instanceId?: string;
}

export const buildDerivedArtifactId = (input: DerivedArtifactRef): string => {
  if (input.kind === "CSV") {
    return `csv--${input.batchId}`;
  }

  if (!input.instanceId) {
    throw new Error("Artefatos PDF exigem instanceId.");
  }

  return `pdf--${input.batchId}--${input.instanceId}`;
};

export const parseDerivedArtifactId = (artifactId: string): DerivedArtifactRef => {
  const [kind, batchId, instanceId] = artifactId.split("--");

  if (kind === "csv" && batchId) {
    return {
      kind: "CSV",
      batchId
    };
  }

  if (kind === "pdf" && batchId && instanceId) {
    return {
      kind: "PDF",
      batchId,
      instanceId
    };
  }

  throw new Error("Identificador de artefato inválido.");
};

export const buildCsvArtifactFileName = (batchId: string): string =>
  `answer-key-${batchId}.csv`;

export const buildPdfArtifactFileName = (examCode: string): string =>
  `exam-${examCode}.pdf`;

export const sortInstancesByExamCode = (instances: ExamInstance[]): ExamInstance[] =>
  [...instances].sort((left, right) => left.examCode.localeCompare(right.examCode));
