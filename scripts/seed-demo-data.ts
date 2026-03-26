import fs from "node:fs/promises";
import path from "node:path";

import request from "supertest";

import { AlternativeIdentificationType } from "../backend/src/domain/entities/alternative-identification-type";
import { buildDisplayAnswer } from "../backend/src/domain/services/answer-normalizer";
import { createPrismaClient } from "../backend/src/infrastructure/database/prisma/client";
import { createApp } from "../backend/src/infrastructure/http/create-app";

interface QuestionSeed {
  topic: string;
  unit: number;
  statement: string;
  options: Array<{
    description: string;
    isCorrect: boolean;
  }>;
}

interface QuestionPayload extends QuestionSeed {
  id: string;
}

interface ExamTemplatePayload {
  id: string;
  title: string;
}

interface GeneratedArtifactPayload {
  kind: "PDF" | "CSV";
  fileName: string;
  absolutePath: string;
  mimeType: string;
}

interface GeneratedExamInstancePayload {
  examCode: string;
  alternativeIdentificationType: AlternativeIdentificationType;
  randomizedQuestions: Array<{
    originalQuestionId: string;
    position: number;
    statement: string;
    randomizedOptions: Array<{
      originalOptionId: string;
      position: number;
      description: string;
      displayCode: string;
      isCorrect: boolean;
    }>;
  }>;
}

interface GradeResponsePayload {
  examId: string;
  strategy: string;
  totalStudents: number;
  averageScore: number;
  students: Array<{
    studentId: string;
    studentName?: string;
    examCode: string;
    totalScore: number;
    percentage: number;
  }>;
}

interface MetricsResponsePayload {
  examId: string;
  summary: {
    totalStudents: number;
    totalQuestions: number;
    averageScore: number;
    averagePercentage: number;
    highestScore: number;
    lowestScore: number;
  };
  lineChartData: Array<{ unit: number }>;
  donutChartsByQuestion: Array<unknown>;
}

interface DemoStudentProfile {
  id: string;
  name: string;
  modifier: number;
}

interface DemoSeedSummary {
  generatedAt: string;
  questionsCount: number;
  template: {
    id: string;
    title: string;
    alternativeIdentificationType: AlternativeIdentificationType;
  };
  batch: {
    batchId: string;
    instances: number;
    pdfFiles: string[];
    answerKeyCsvPath: string;
    studentResponsesCsvPath: string;
  };
  grading: {
    examId: string;
    strategy: string;
    totalStudents: number;
    averageScore: number;
    averagePercentage: number;
    highestScore: number;
    lowestScore: number;
  };
  dashboard: {
    metricsUrl: string;
    insightsUrl: string;
    frontendUrl: string;
    genericDashboardUrl: string;
    insightsWarning?: string;
  };
}

const DEMO_TEMPLATE_TITLE = "[DEMO] Matemática Diagnóstica 2026.1";

const DEMO_QUESTIONS: QuestionSeed[] = [
  {
    topic: "Demo Matemática | Unidade 1 | Operações Algébricas",
    unit: 1,
    statement: "Sobre frações equivalentes, assinale as alternativas corretas.",
    options: [
      { description: "1/2 e 2/4 representam o mesmo valor.", isCorrect: true },
      { description: "3/5 e 6/10 são equivalentes.", isCorrect: true },
      { description: "2/3 e 3/2 são equivalentes.", isCorrect: false },
      { description: "4/8 é maior que 1/2.", isCorrect: false }
    ]
  },
  {
    topic: "Demo Matemática | Unidade 1 | Operações Algébricas",
    unit: 1,
    statement: "Qual equação possui solução x = 7?",
    options: [
      { description: "x + 2 = 9", isCorrect: true },
      { description: "2x = 7", isCorrect: false },
      { description: "x - 7 = 7", isCorrect: false },
      { description: "x + 7 = 7", isCorrect: false }
    ]
  },
  {
    topic: "Demo Matemática | Unidade 1 | Operações Algébricas",
    unit: 1,
    statement: "Selecione as expressões cujo resultado é 12.",
    options: [
      { description: "3 x 4", isCorrect: true },
      { description: "18 - 6", isCorrect: true },
      { description: "6 + 5", isCorrect: false },
      { description: "2 x 5", isCorrect: false }
    ]
  },
  {
    topic: "Demo Matemática | Unidade 2 | Geometria Plana",
    unit: 2,
    statement: "Sobre triângulos, assinale as afirmativas corretas.",
    options: [
      { description: "Todo triângulo possui três lados.", isCorrect: true },
      { description: "A soma dos ângulos internos de um triângulo é 180°.", isCorrect: true },
      { description: "Um triângulo pode ter dois ângulos retos.", isCorrect: false },
      { description: "Todo triângulo equilátero possui lados com medidas diferentes.", isCorrect: false }
    ]
  },
  {
    topic: "Demo Matemática | Unidade 2 | Geometria Plana",
    unit: 2,
    statement: "Qual é a área de um retângulo com base 6 cm e altura 4 cm?",
    options: [
      { description: "10 cm²", isCorrect: false },
      { description: "20 cm²", isCorrect: false },
      { description: "24 cm²", isCorrect: true },
      { description: "28 cm²", isCorrect: false }
    ]
  },
  {
    topic: "Demo Matemática | Unidade 2 | Geometria Plana",
    unit: 2,
    statement: "Ângulos complementares são aqueles cuja soma é:",
    options: [
      { description: "45°", isCorrect: false },
      { description: "90°", isCorrect: true },
      { description: "180°", isCorrect: false },
      { description: "360°", isCorrect: false }
    ]
  },
  {
    topic: "Demo Matemática | Unidade 3 | Estatística e Probabilidade",
    unit: 3,
    statement: "Em uma moeda justa, qual é a probabilidade de sair cara em um único lançamento?",
    options: [
      { description: "25%", isCorrect: false },
      { description: "50%", isCorrect: true },
      { description: "75%", isCorrect: false },
      { description: "100%", isCorrect: false }
    ]
  },
  {
    topic: "Demo Matemática | Unidade 3 | Estatística e Probabilidade",
    unit: 3,
    statement: "Quais medidas podem representar tendência central de um conjunto de dados?",
    options: [
      { description: "Média", isCorrect: true },
      { description: "Moda", isCorrect: true },
      { description: "Mediana", isCorrect: true },
      { description: "Amplitude", isCorrect: false }
    ]
  },
  {
    topic: "Demo Matemática | Unidade 3 | Estatística e Probabilidade",
    unit: 3,
    statement: "Ao analisar um gráfico de barras, qual informação costuma ser comparada entre categorias?",
    options: [
      { description: "Frequência ou quantidade.", isCorrect: true },
      { description: "Temperatura de fusão.", isCorrect: false },
      { description: "Somente números negativos.", isCorrect: false },
      { description: "Apenas fórmulas algébricas.", isCorrect: false }
    ]
  },
  {
    topic: "Demo Matemática | Unidade 4 | Funções",
    unit: 4,
    statement: "Na função y = 2x + 3, qual é o valor de y quando x = 4?",
    options: [
      { description: "8", isCorrect: false },
      { description: "10", isCorrect: false },
      { description: "11", isCorrect: true },
      { description: "13", isCorrect: false }
    ]
  },
  {
    topic: "Demo Matemática | Unidade 4 | Funções",
    unit: 4,
    statement: "Selecione os pares ordenados que pertencem à função y = x².",
    options: [
      { description: "(2, 4)", isCorrect: true },
      { description: "(-3, 9)", isCorrect: true },
      { description: "(4, 2)", isCorrect: false },
      { description: "(1, 0)", isCorrect: false }
    ]
  },
  {
    topic: "Demo Matemática | Unidade 4 | Funções",
    unit: 4,
    statement: "Um produto custava R$ 80 e sofreu aumento de 25%. Qual é o novo valor?",
    options: [
      { description: "R$ 90", isCorrect: false },
      { description: "R$ 95", isCorrect: false },
      { description: "R$ 100", isCorrect: true },
      { description: "R$ 105", isCorrect: false }
    ]
  }
];

const STUDENT_PROFILES: DemoStudentProfile[] = [
  { id: "DEMO-001", name: "Ana Clara", modifier: 0.12 },
  { id: "DEMO-002", name: "Bruno Lima", modifier: 0.08 },
  { id: "DEMO-003", name: "Camila Rocha", modifier: 0.05 },
  { id: "DEMO-004", name: "Diego Alves", modifier: 0.02 },
  { id: "DEMO-005", name: "Eduarda Nunes", modifier: -0.01 },
  { id: "DEMO-006", name: "Felipe Costa", modifier: -0.04 },
  { id: "DEMO-007", name: "Gabriela Melo", modifier: -0.07 },
  { id: "DEMO-008", name: "Henrique Silva", modifier: -0.1 },
  { id: "DEMO-009", name: "Isabela Souza", modifier: -0.13 },
  { id: "DEMO-010", name: "João Pedro", modifier: -0.16 },
  { id: "DEMO-011", name: "Larissa Gomes", modifier: -0.19 },
  { id: "DEMO-012", name: "Mateus Vieira", modifier: -0.22 }
];

const baseAccuracyByUnit: Record<number, number> = {
  1: 0.9,
  2: 0.77,
  3: 0.56,
  4: 0.82
};

const escapeCsvValue = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
};

const stringifyCsv = (rows: string[][]): string =>
  rows.map((row) => row.map((value) => escapeCsvValue(value)).join(",")).join("\n");

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const hashSeed = (value: string): number => {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createDeterministicRandom = (seed: string): (() => number) => {
  let state = hashSeed(seed) || 1;

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const buildMarkedAnswer = (
  states: boolean[],
  question: GeneratedExamInstancePayload["randomizedQuestions"][number],
  alternativeIdentificationType: AlternativeIdentificationType
): string =>
  buildDisplayAnswer(
    states,
    question,
    alternativeIdentificationType
  );

const buildStudentStates = (
  studentProfile: DemoStudentProfile,
  question: GeneratedExamInstancePayload["randomizedQuestions"][number],
  unit: number
): boolean[] => {
  const expectedStates = question.randomizedOptions.map((option) => option.isCorrect);
  const random = createDeterministicRandom(
    `${studentProfile.id}:${question.originalQuestionId}:${unit}`
  );
  const questionDrift = (random() - 0.5) * 0.08;
  const accuracy = clamp(
    (baseAccuracyByUnit[unit] ?? 0.68) + studentProfile.modifier + questionDrift,
    0.18,
    0.97
  );

  const actualStates = expectedStates.map((expectedState) =>
    random() < accuracy ? expectedState : !expectedState
  );

  if (actualStates.every((state) => !state) && random() < 0.85) {
    const fallbackIndex = Math.floor(random() * actualStates.length);
    actualStates[fallbackIndex] = true;
  }

  return actualStates;
};

const assertStatus = (
  actualStatus: number,
  expectedStatus: number,
  action: string,
  payload: unknown
): void => {
  if (actualStatus !== expectedStatus) {
    throw new Error(
      `${action} retornou ${actualStatus} em vez de ${expectedStatus}: ${JSON.stringify(payload, null, 2)}`
    );
  }
};

const buildQuestionKey = (question: QuestionSeed): string =>
  [question.topic, String(question.unit), question.statement].join("::");

const ensureQuestion = async (
  app: ReturnType<typeof createApp>,
  seed: QuestionSeed,
  existingQuestion?: QuestionPayload
): Promise<QuestionPayload> => {
  if (existingQuestion) {
    const response = await request(app).put(`/questions/${existingQuestion.id}`).send(seed);
    assertStatus(response.status, 200, `Atualização da questão ${existingQuestion.id}`, response.body);
    return response.body as QuestionPayload;
  }

  const response = await request(app).post("/questions").send(seed);
  assertStatus(response.status, 201, `Criação da questão ${seed.statement}`, response.body);
  return response.body as QuestionPayload;
};

const ensureExamTemplate = async (
  app: ReturnType<typeof createApp>,
  title: string,
  questionIds: string[]
): Promise<ExamTemplatePayload> => {
  const listResponse = await request(app).get("/exam-templates");
  assertStatus(listResponse.status, 200, "Listagem de modelos de prova", listResponse.body);

  const existingTemplate = (listResponse.body as ExamTemplatePayload[]).find(
    (examTemplate) => examTemplate.title === title
  );

  const payload = {
    title,
    questionIds,
    alternativeIdentificationType: AlternativeIdentificationType.LETTERS
  };

  if (existingTemplate) {
    const response = await request(app).put(`/exam-templates/${existingTemplate.id}`).send(payload);
    assertStatus(response.status, 200, `Atualização do modelo ${existingTemplate.id}`, response.body);
    return response.body as ExamTemplatePayload;
  }

  const response = await request(app).post("/exam-templates").send(payload);
  assertStatus(response.status, 201, `Criação do modelo ${title}`, response.body);
  return response.body as ExamTemplatePayload;
};

const buildStudentResponsesCsv = (
  instances: GeneratedExamInstancePayload[],
  questionLookup: Map<string, QuestionPayload>
): string => {
  const rows: string[][] = [["studentId", "studentName", "examCode", "questionPosition", "markedAnswer"]];

  instances.forEach((instance, index) => {
    const studentProfile = STUDENT_PROFILES[index];

    if (!studentProfile) {
      return;
    }

    for (const question of instance.randomizedQuestions) {
      const originalQuestion = questionLookup.get(question.originalQuestionId);
      if (!originalQuestion) {
        throw new Error(`Questão original não encontrada: ${question.originalQuestionId}`);
      }

      const actualStates = buildStudentStates(studentProfile, question, originalQuestion.unit);

      rows.push([
        studentProfile.id,
        studentProfile.name,
        instance.examCode,
        String(question.position),
        buildMarkedAnswer(actualStates, question, instance.alternativeIdentificationType)
      ]);
    }
  });

  return stringifyCsv(rows);
};

const main = async (): Promise<void> => {
  const prismaClient = createPrismaClient();
  await prismaClient.$connect();

  try {
    const app = createApp({ prismaClient });

    const listQuestionsResponse = await request(app).get("/questions");
    assertStatus(listQuestionsResponse.status, 200, "Listagem de questões", listQuestionsResponse.body);

    const existingQuestions = new Map<string, QuestionPayload>(
      (listQuestionsResponse.body as QuestionPayload[]).map((question) => [
        buildQuestionKey(question),
        question
      ])
    );

    const questions: QuestionPayload[] = [];
    for (const seed of DEMO_QUESTIONS) {
      const question = await ensureQuestion(app, seed, existingQuestions.get(buildQuestionKey(seed)));
      questions.push(question);
    }

    const questionLookup = new Map(questions.map((question) => [question.id, question]));
    const examTemplate = await ensureExamTemplate(
      app,
      DEMO_TEMPLATE_TITLE,
      questions.map((question) => question.id)
    );

    const generationResponse = await request(app)
      .post(`/exam-templates/${examTemplate.id}/generate`)
      .send({ quantity: STUDENT_PROFILES.length });
    assertStatus(generationResponse.status, 201, "Geração das provas individuais", generationResponse.body);

    const batchId = generationResponse.body.batchId as string;
    const instances = generationResponse.body.instances as GeneratedExamInstancePayload[];
    const artifacts = generationResponse.body.artifacts as GeneratedArtifactPayload[];

    const answerKeyArtifact = artifacts.find((artifact) => artifact.kind === "CSV");
    if (!answerKeyArtifact) {
      throw new Error("O arquivo de gabarito CSV não foi retornado.");
    }

    const outputDir = path.dirname(answerKeyArtifact.absolutePath);
    const studentResponsesCsv = buildStudentResponsesCsv(instances, questionLookup);
    const studentResponsesCsvPath = path.resolve(outputDir, `student-responses-${batchId}.csv`);
    await fs.writeFile(studentResponsesCsvPath, studentResponsesCsv, "utf-8");

    const answerKeyBuffer = await fs.readFile(answerKeyArtifact.absolutePath);
    const gradeResponse = await request(app)
      .post("/exams/grade")
      .field("gradingStrategyType", "PROPORTIONAL")
      .attach("answerKeyFile", answerKeyBuffer, {
        filename: path.basename(answerKeyArtifact.absolutePath),
        contentType: "text/csv"
      })
      .attach("studentResponsesFile", Buffer.from(studentResponsesCsv, "utf-8"), {
        filename: path.basename(studentResponsesCsvPath),
        contentType: "text/csv"
      });
    assertStatus(gradeResponse.status, 200, "Correção das provas", gradeResponse.body);

    const gradePayload = gradeResponse.body as GradeResponsePayload;
    const metricsResponse = await request(app).get(`/exams/${gradePayload.examId}/metrics`);
    assertStatus(metricsResponse.status, 200, "Leitura das métricas do dashboard", metricsResponse.body);

    const insightsResponse = await request(app).get(`/exams/${gradePayload.examId}/insights`);
    assertStatus(insightsResponse.status, 200, "Leitura dos insights do dashboard", insightsResponse.body);

    const metricsPayload = metricsResponse.body as MetricsResponsePayload;
    const pdfArtifacts = artifacts
      .filter((artifact) => artifact.kind === "PDF")
      .map((artifact) => artifact.absolutePath);

    const summary: DemoSeedSummary = {
      generatedAt: new Date().toISOString(),
      questionsCount: questions.length,
      template: {
        id: examTemplate.id,
        title: examTemplate.title,
        alternativeIdentificationType: AlternativeIdentificationType.LETTERS
      },
      batch: {
        batchId,
        instances: instances.length,
        pdfFiles: pdfArtifacts,
        answerKeyCsvPath: answerKeyArtifact.absolutePath,
        studentResponsesCsvPath
      },
      grading: {
        examId: gradePayload.examId,
        strategy: gradePayload.strategy,
        totalStudents: gradePayload.totalStudents,
        averageScore: Number(metricsPayload.summary.averageScore.toFixed(2)),
        averagePercentage: Number(metricsPayload.summary.averagePercentage.toFixed(2)),
        highestScore: Number(metricsPayload.summary.highestScore.toFixed(2)),
        lowestScore: Number(metricsPayload.summary.lowestScore.toFixed(2))
      },
      dashboard: {
        metricsUrl: `http://127.0.0.1:3000/exams/${gradePayload.examId}/metrics`,
        insightsUrl: `http://127.0.0.1:3000/exams/${gradePayload.examId}/insights`,
        frontendUrl: `http://127.0.0.1:5173/exams/${gradePayload.examId}`,
        genericDashboardUrl: "http://127.0.0.1:5173/dashboard",
        insightsWarning:
          typeof insightsResponse.body.warning === "string"
            ? insightsResponse.body.warning
            : undefined
      }
    };

    await fs.mkdir(path.resolve(process.cwd(), "output"), { recursive: true });
    await fs.writeFile(
      path.resolve(process.cwd(), "output/demo-seed-summary.json"),
      JSON.stringify(summary, null, 2),
      "utf-8"
    );

    console.log("\nCarga de demonstração criada com sucesso.\n");
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prismaClient.$disconnect();
  }
};

main().catch((error) => {
  console.error("\nFalha ao criar a carga de demonstração.\n");
  console.error(error);
  process.exit(1);
});
