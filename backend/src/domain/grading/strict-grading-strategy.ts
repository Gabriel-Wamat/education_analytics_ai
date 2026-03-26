import { IGradingStrategy } from "./grading-strategy";

export class StrictGradingStrategy implements IGradingStrategy {
  calculateQuestionScore(expectedStates: boolean[], actualStates: boolean[]): number {
    if (expectedStates.length !== actualStates.length) {
      throw new Error("Os vetores de resposta precisam ter o mesmo tamanho.");
    }

    return expectedStates.every((state, index) => state === actualStates[index]) ? 1 : 0;
  }
}
