import { IWorldOptions, World, setWorldConstructor } from "@cucumber/cucumber";
import { Response } from "supertest";

export class AcceptanceWorld extends World {
  response?: Response;
  questionIds: string[] = [];
  deletedQuestionId?: string;
  examTemplateId?: string;
  examId?: string;
  batchId?: string;
  answerKeyArtifactPath?: string;
  answerKeyArtifactId?: string;
  answerKeyDownloadUrl?: string;
  generatedInstances: Array<Record<string, unknown>> = [];
  generatedArtifacts: Array<Record<string, unknown>> = [];

  // ================================================================
  // Novos módulos: alunos, metas, turmas, avaliações, digest de e-mail.
  // ================================================================
  studentsByName: Map<string, { id: string; email: string; name: string }> = new Map();
  goalsByName: Map<string, { id: string; name: string; description?: string }> = new Map();
  classesByTopic: Map<string, { id: string; topic: string; year: number; semester: number }> = new Map();
  lastStudentId?: string;
  lastGoalId?: string;
  lastClassId?: string;
  digestResult?: {
    digestDate: string;
    emailsSent: number;
    entriesProcessed: number;
    emailsFailed: number;
    digestsByStudent: Array<Record<string, unknown>>;
  };

  constructor(options: IWorldOptions) {
    super(options);
  }

  reset(): void {
    this.response = undefined;
    this.questionIds = [];
    this.deletedQuestionId = undefined;
    this.examTemplateId = undefined;
    this.examId = undefined;
    this.batchId = undefined;
    this.answerKeyArtifactPath = undefined;
    this.answerKeyArtifactId = undefined;
    this.answerKeyDownloadUrl = undefined;
    this.generatedInstances = [];
    this.generatedArtifacts = [];
    this.studentsByName = new Map();
    this.goalsByName = new Map();
    this.classesByTopic = new Map();
    this.lastStudentId = undefined;
    this.lastGoalId = undefined;
    this.lastClassId = undefined;
    this.digestResult = undefined;
  }
}

setWorldConstructor(AcceptanceWorld);
