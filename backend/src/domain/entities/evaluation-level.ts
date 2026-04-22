export enum EvaluationLevel {
  /** Meta Ainda Não Atingida. */
  MANA = "MANA",
  /** Meta Parcialmente Atingida. */
  MPA = "MPA",
  /** Meta Atingida. */
  MA = "MA"
}

export const EVALUATION_LEVELS = [
  EvaluationLevel.MANA,
  EvaluationLevel.MPA,
  EvaluationLevel.MA
] as const;

export const EVALUATION_LEVEL_LABELS: Record<EvaluationLevel, string> = {
  [EvaluationLevel.MANA]: "Meta Ainda Não Atingida",
  [EvaluationLevel.MPA]: "Meta Parcialmente Atingida",
  [EvaluationLevel.MA]: "Meta Atingida"
};

export const isEvaluationLevel = (value: unknown): value is EvaluationLevel =>
  typeof value === "string" && (EVALUATION_LEVELS as readonly string[]).includes(value);
