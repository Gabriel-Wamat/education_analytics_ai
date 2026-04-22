import { EmailLog } from "../../../domain/entities/email-log";
import { IEmailLogRepository } from "../../../domain/repositories/email-log-repository";
import { JsonFileStore } from "../../storage/json-file-store";

interface EmailLogJson {
  id: string;
  studentId: string;
  studentName: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  digestDate: string;
  classIds: string[];
  goalIds: string[];
  entriesCount: number;
  status: EmailLog["status"];
  attemptedAt: string;
  failureReason?: string;
}

interface StoreShape {
  entries: EmailLogJson[];
}

const reviveEntry = (raw: EmailLogJson): EmailLog => ({
  id: raw.id,
  studentId: raw.studentId,
  studentName: raw.studentName,
  to: raw.to,
  subject: raw.subject,
  text: raw.text,
  html: raw.html,
  digestDate: raw.digestDate,
  classIds: raw.classIds,
  goalIds: raw.goalIds,
  entriesCount: raw.entriesCount,
  status: raw.status,
  attemptedAt: new Date(raw.attemptedAt),
  failureReason: raw.failureReason
});

const dehydrateEntry = (entry: EmailLog): EmailLogJson => ({
  id: entry.id,
  studentId: entry.studentId,
  studentName: entry.studentName,
  to: entry.to,
  subject: entry.subject,
  text: entry.text,
  ...(entry.html ? { html: entry.html } : {}),
  digestDate: entry.digestDate,
  classIds: entry.classIds,
  goalIds: entry.goalIds,
  entriesCount: entry.entriesCount,
  status: entry.status,
  attemptedAt: entry.attemptedAt.toISOString(),
  ...(entry.failureReason ? { failureReason: entry.failureReason } : {})
});

export class JsonEmailLogRepository implements IEmailLogRepository {
  private readonly store: JsonFileStore<StoreShape>;

  constructor(filePath: string) {
    this.store = new JsonFileStore<StoreShape>(
      filePath,
      () => ({ entries: [] }),
      (raw) => raw as StoreShape
    );
  }

  async create(entry: EmailLog): Promise<EmailLog> {
    return this.store.mutate((state) => {
      state.entries.unshift(dehydrateEntry(entry));
      return { state, result: entry };
    });
  }

  async findAll(): Promise<EmailLog[]> {
    const state = await this.store.read();
    return state.entries.map(reviveEntry);
  }
}
