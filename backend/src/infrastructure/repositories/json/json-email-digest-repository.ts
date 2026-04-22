import { EmailDigestEntry } from "../../../domain/entities/email-notification";
import { IEmailDigestRepository } from "../../../domain/repositories/email-digest-repository";
import { JsonFileStore } from "../../storage/json-file-store";

interface EmailDigestJson {
  id: string;
  studentId: string;
  classId: string;
  goalId: string;
  previousLevel: EmailDigestEntry["previousLevel"];
  newLevel: EmailDigestEntry["newLevel"];
  changedAt: string;
  digestDate: string;
  status: EmailDigestEntry["status"];
  sentAt?: string;
  failureReason?: string;
}

interface StoreShape {
  entries: EmailDigestJson[];
}

const reviveEntry = (raw: EmailDigestJson): EmailDigestEntry => ({
  id: raw.id,
  studentId: raw.studentId,
  classId: raw.classId,
  goalId: raw.goalId,
  previousLevel: raw.previousLevel,
  newLevel: raw.newLevel,
  changedAt: new Date(raw.changedAt),
  digestDate: raw.digestDate,
  status: raw.status,
  sentAt: raw.sentAt ? new Date(raw.sentAt) : undefined,
  failureReason: raw.failureReason
});

const dehydrateEntry = (entry: EmailDigestEntry): EmailDigestJson => ({
  id: entry.id,
  studentId: entry.studentId,
  classId: entry.classId,
  goalId: entry.goalId,
  previousLevel: entry.previousLevel,
  newLevel: entry.newLevel,
  changedAt: entry.changedAt.toISOString(),
  digestDate: entry.digestDate,
  status: entry.status,
  ...(entry.sentAt ? { sentAt: entry.sentAt.toISOString() } : {}),
  ...(entry.failureReason ? { failureReason: entry.failureReason } : {})
});

export class JsonEmailDigestRepository implements IEmailDigestRepository {
  private readonly store: JsonFileStore<StoreShape>;

  constructor(filePath: string) {
    this.store = new JsonFileStore<StoreShape>(
      filePath,
      () => ({ entries: [] }),
      (raw) => raw as StoreShape
    );
  }

  async findAll(): Promise<EmailDigestEntry[]> {
    const state = await this.store.read();
    return state.entries.map(reviveEntry);
  }

  async findAllPending(): Promise<EmailDigestEntry[]> {
    const all = await this.findAll();
    return all.filter((entry) => entry.status === "pending");
  }

  async findAllPendingByDate(digestDate: string): Promise<EmailDigestEntry[]> {
    const all = await this.findAll();
    return all.filter(
      (entry) => entry.status === "pending" && entry.digestDate === digestDate
    );
  }

  async findPendingByStudentAndDate(
    studentId: string,
    digestDate: string
  ): Promise<EmailDigestEntry[]> {
    const all = await this.findAll();
    return all.filter(
      (entry) =>
        entry.status === "pending" &&
        entry.studentId === studentId &&
        entry.digestDate === digestDate
    );
  }

  async enqueue(entry: EmailDigestEntry): Promise<EmailDigestEntry> {
    return this.store.mutate((state) => {
      state.entries.push(dehydrateEntry(entry));
      return { state, result: entry };
    });
  }

  async markSent(ids: string[], sentAt: Date): Promise<void> {
    await this.store.mutate((state) => {
      const idSet = new Set(ids);
      state.entries = state.entries.map((entry) => {
        if (!idSet.has(entry.id)) return entry;
        return { ...entry, status: "sent", sentAt: sentAt.toISOString() };
      });
      return { state, result: undefined };
    });
  }

  async markFailed(ids: string[], reason: string): Promise<void> {
    await this.store.mutate((state) => {
      const idSet = new Set(ids);
      state.entries = state.entries.map((entry) => {
        if (!idSet.has(entry.id)) return entry;
        return { ...entry, status: "failed", failureReason: reason };
      });
      return { state, result: undefined };
    });
  }

  async purgeBefore(date: Date): Promise<number> {
    const cutoff = date.getTime();
    return this.store.mutate((state) => {
      const before = state.entries.length;
      state.entries = state.entries.filter((entry) => {
        if (entry.status === "pending") return true;
        const reference = entry.sentAt
          ? new Date(entry.sentAt).getTime()
          : new Date(entry.changedAt).getTime();
        return reference >= cutoff;
      });
      return { state, result: before - state.entries.length };
    });
  }
}
