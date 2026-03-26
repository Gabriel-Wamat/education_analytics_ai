export interface IGradingStrategy {
  calculateQuestionScore(expectedStates: boolean[], actualStates: boolean[]): number;
}
