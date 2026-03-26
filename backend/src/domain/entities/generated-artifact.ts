export type GeneratedArtifactKind = "PDF" | "CSV";

export interface GeneratedArtifact {
  kind: GeneratedArtifactKind;
  fileName: string;
  absolutePath: string;
  mimeType: string;
}
