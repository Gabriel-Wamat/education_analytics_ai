import { ClassGroup } from "../../../domain/entities/class-group";
import { IClassGroupRepository } from "../../../domain/repositories/class-group-repository";
import { JsonFileStore } from "../../storage/json-file-store";

interface ClassGroupJson {
  id: string;
  topic: string;
  year: number;
  semester: 1 | 2;
  studentIds: string[];
  goalIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface StoreShape {
  classes: ClassGroupJson[];
}

const reviveClass = (raw: ClassGroupJson): ClassGroup => ({
  id: raw.id,
  topic: raw.topic,
  year: raw.year,
  semester: raw.semester,
  studentIds: [...raw.studentIds],
  goalIds: [...raw.goalIds],
  createdAt: new Date(raw.createdAt),
  updatedAt: new Date(raw.updatedAt)
});

const dehydrateClass = (classGroup: ClassGroup): ClassGroupJson => ({
  id: classGroup.id,
  topic: classGroup.topic,
  year: classGroup.year,
  semester: classGroup.semester,
  studentIds: [...classGroup.studentIds],
  goalIds: [...classGroup.goalIds],
  createdAt: classGroup.createdAt.toISOString(),
  updatedAt: classGroup.updatedAt.toISOString()
});

export class JsonClassGroupRepository implements IClassGroupRepository {
  private readonly store: JsonFileStore<StoreShape>;

  constructor(filePath: string) {
    this.store = new JsonFileStore<StoreShape>(
      filePath,
      () => ({ classes: [] }),
      (raw) => raw as StoreShape
    );
  }

  async findAll(): Promise<ClassGroup[]> {
    const state = await this.store.read();
    return state.classes.map(reviveClass);
  }

  async findById(id: string): Promise<ClassGroup | null> {
    const state = await this.store.read();
    const found = state.classes.find((c) => c.id === id);
    return found ? reviveClass(found) : null;
  }

  async findByStudentId(studentId: string): Promise<ClassGroup[]> {
    const state = await this.store.read();
    return state.classes
      .filter((c) => c.studentIds.includes(studentId))
      .map(reviveClass);
  }

  async findByGoalId(goalId: string): Promise<ClassGroup[]> {
    const state = await this.store.read();
    return state.classes
      .filter((c) => c.goalIds.includes(goalId))
      .map(reviveClass);
  }

  async create(classGroup: ClassGroup): Promise<ClassGroup> {
    return this.store.mutate((state) => {
      state.classes.push(dehydrateClass(classGroup));
      return { state, result: classGroup };
    });
  }

  async update(classGroup: ClassGroup): Promise<ClassGroup> {
    return this.store.mutate((state) => {
      const index = state.classes.findIndex((c) => c.id === classGroup.id);
      if (index === -1) {
        throw new Error(`Turma ${classGroup.id} não encontrada para atualização.`);
      }
      state.classes[index] = dehydrateClass(classGroup);
      return { state, result: classGroup };
    });
  }

  async delete(id: string): Promise<void> {
    await this.store.mutate((state) => {
      const next: StoreShape = { classes: state.classes.filter((c) => c.id !== id) };
      return { state: next, result: undefined };
    });
  }
}
