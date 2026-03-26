import { IGradingStrategy } from "../../domain/grading/grading-strategy";
import { ProportionalGradingStrategy } from "../../domain/grading/proportional-grading-strategy";
import { StrictGradingStrategy } from "../../domain/grading/strict-grading-strategy";
import { GradingStrategyType } from "../../domain/entities/grading-strategy-type";

export const createGradingStrategy = (
  gradingStrategyType: GradingStrategyType
): IGradingStrategy => {
  switch (gradingStrategyType) {
    case GradingStrategyType.STRICT:
      return new StrictGradingStrategy();
    case GradingStrategyType.PROPORTIONAL:
      return new ProportionalGradingStrategy();
    default:
      throw new Error(`Estratégia de correção não suportada: ${gradingStrategyType}`);
  }
};
