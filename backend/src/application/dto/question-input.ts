export interface QuestionOptionInput {
  description: string;
  isCorrect: boolean;
}

export interface QuestionInput {
  topic: string;
  unit: number;
  statement: string;
  options: QuestionOptionInput[];
}
