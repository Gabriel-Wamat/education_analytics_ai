export const buildExamArtifactDownloadUrl = (artifactId: string): string =>
  `/api/exam-batches/artifacts/${artifactId}/download`;
