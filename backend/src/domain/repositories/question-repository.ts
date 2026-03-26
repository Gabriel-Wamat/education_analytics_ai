import { Question } from "../entities/question";

export interface IQuestionRepository {
  create(question: Question): Promise<Question>;
  update(question: Question): Promise<Question>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Question | null>;
  findAll(): Promise<Question[]>;
  findByIds(ids: string[]): Promise<Question[]>;
}
