import {
  AlternativeIdentificationType,
  GeneratedArtifact
} from "@/types/api";

export interface ExamHeaderDraft {
  discipline: string;
  teacher: string;
  date: string;
}

export interface QuestionFormValues {
  topic: string;
  unit: number;
  statement: string;
  options: Array<{
    description: string;
    isCorrect: boolean;
  }>;
}

export interface ExamWizardDraft {
  title: string;
  alternativeIdentificationType: AlternativeIdentificationType;
  header: ExamHeaderDraft;
  selectedQuestionIds: string[];
}

export interface ArtifactViewModel extends GeneratedArtifact {
  downloadUrl?: string;
}
