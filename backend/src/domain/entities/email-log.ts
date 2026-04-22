export interface EmailLog {
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
  status: "sent" | "failed";
  attemptedAt: Date;
  failureReason?: string;
}
