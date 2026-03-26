import { IGradingStrategy } from "./grading-strategy";

export class ProportionalGradingStrategy implements IGradingStrategy {
  calculateQuestionScore(expectedStates: boolean[], actualStates: boolean[]): number {
    if (expectedStates.length !== actualStates.length) {
      throw new Error("Os vetores de resposta precisam ter o mesmo tamanho.");
    }

    const matchingStates = expectedStates.filter(
      (state, index) => state === actualStates[index]
    ).length;

    return matchingStates / expectedStates.length;
  }
}
