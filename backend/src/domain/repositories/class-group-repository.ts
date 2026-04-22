import { ClassGroup } from "../entities/class-group";

export interface IClassGroupRepository {
  create(classGroup: ClassGroup): Promise<ClassGroup>;
  update(classGroup: ClassGroup): Promise<ClassGroup>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<ClassGroup | null>;
  findAll(): Promise<ClassGroup[]>;
  findByStudentId(studentId: string): Promise<ClassGroup[]>;
  findByGoalId(goalId: string): Promise<ClassGroup[]>;
}
