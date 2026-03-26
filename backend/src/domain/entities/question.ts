import { Option } from "./option";

export interface Question {
  id: string;
  topic: string;
  unit: number;
  statement: string;
  options: Option[];
  createdAt: Date;
  updatedAt: Date;
}
