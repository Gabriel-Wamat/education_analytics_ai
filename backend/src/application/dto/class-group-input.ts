export interface ClassGroupInput {
  topic: string;
  year: number;
  semester: 1 | 2;
  studentIds?: string[];
  goalIds?: string[];
}
