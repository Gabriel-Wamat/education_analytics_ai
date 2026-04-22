import { Student } from "../../../domain/entities/student";
import { IStudentRepository } from "../../../domain/repositories/student-repository";
import { JsonFileStore } from "../../storage/json-file-store";

interface StudentJson {
  id: string;
  name: string;
  cpf: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface StoreShape {
  students: StudentJson[];
}

const reviveStudent = (raw: StudentJson): Student => ({
  id: raw.id,
  name: raw.name,
  cpf: raw.cpf,
  email: raw.email,
  createdAt: new Date(raw.createdAt),
  updatedAt: new Date(raw.updatedAt)
});

const dehydrateStudent = (student: Student): StudentJson => ({
  id: student.id,
  name: student.name,
  cpf: student.cpf,
  email: student.email,
  createdAt: student.createdAt.toISOString(),
  updatedAt: student.updatedAt.toISOString()
});

export class JsonStudentRepository implements IStudentRepository {
  private readonly store: JsonFileStore<StoreShape>;

  constructor(filePath: string) {
    this.store = new JsonFileStore<StoreShape>(
      filePath,
      () => ({ students: [] }),
      (raw) => raw as StoreShape
    );
  }

  async findAll(): Promise<Student[]> {
    const state = await this.store.read();
    return state.students.map(reviveStudent);
  }

  async findById(id: string): Promise<Student | null> {
    const state = await this.store.read();
    const found = state.students.find((s) => s.id === id);
    return found ? reviveStudent(found) : null;
  }

  async findByCpf(cpf: string): Promise<Student | null> {
    const state = await this.store.read();
    const found = state.students.find((s) => s.cpf === cpf);
    return found ? reviveStudent(found) : null;
  }

  async findByEmail(email: string): Promise<Student | null> {
    const state = await this.store.read();
    const target = email.toLowerCase();
    const found = state.students.find((s) => s.email.toLowerCase() === target);
    return found ? reviveStudent(found) : null;
  }

  async findByIds(ids: string[]): Promise<Student[]> {
    const state = await this.store.read();
    const idSet = new Set(ids);
    return state.students.filter((s) => idSet.has(s.id)).map(reviveStudent);
  }

  async create(student: Student): Promise<Student> {
    return this.store.mutate((state) => {
      state.students.push(dehydrateStudent(student));
      return { state, result: student };
    });
  }

  async update(student: Student): Promise<Student> {
    return this.store.mutate((state) => {
      const index = state.students.findIndex((s) => s.id === student.id);
      if (index === -1) {
        throw new Error(`Aluno ${student.id} não encontrado para atualização.`);
      }
      state.students[index] = dehydrateStudent(student);
      return { state, result: student };
    });
  }

  async delete(id: string): Promise<void> {
    await this.store.mutate((state) => {
      const next: StoreShape = {
        students: state.students.filter((s) => s.id !== id)
      };
      return { state: next, result: undefined };
    });
  }
}
