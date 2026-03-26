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
  generatedInstances: Array<Record<string, unknown>> = [];
  generatedArtifacts: Array<Record<string, unknown>> = [];

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
    this.generatedInstances = [];
    this.generatedArtifacts = [];
  }
}

setWorldConstructor(AcceptanceWorld);
