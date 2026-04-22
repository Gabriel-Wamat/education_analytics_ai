import { Student } from "../entities/student";

export interface IStudentRepository {
  create(student: Student): Promise<Student>;
  update(student: Student): Promise<Student>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Student | null>;
  findByCpf(cpf: string): Promise<Student | null>;
  findByEmail(email: string): Promise<Student | null>;
  findAll(): Promise<Student[]>;
  findByIds(ids: string[]): Promise<Student[]>;
}
