import { EvaluationLevel } from "./evaluation-level";

/**
 * Item enfileirado para o resumo diário enviado por email após a alteração
 * de uma avaliação. Cada item registra a meta e a turma onde a mudança
 * ocorreu, suficiente para compor o digest agregado por aluno.
 */
export interface EmailDigestEntry {
  id: string;
  studentId: string;
  classId: string;
  goalId: string;
  previousLevel: EvaluationLevel | null;
  newLevel: EvaluationLevel;
  changedAt: Date;
  /** Bucket diário no formato `YYYY-MM-DD` (timezone do servidor). */
  digestDate: string;
  status: "pending" | "sent" | "failed";
  sentAt?: Date;
  failureReason?: string;
}
