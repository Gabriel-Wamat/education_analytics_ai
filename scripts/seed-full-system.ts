import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import request from "supertest";

import {
  EmailDeliveryReport,
  EmailMessage,
  IEmailService
} from "../backend/src/application/services/email-service";
import { AlternativeIdentificationType } from "../backend/src/domain/entities/alternative-identification-type";
import { EvaluationLevel } from "../backend/src/domain/entities/evaluation-level";
import { buildDisplayAnswer } from "../backend/src/domain/services/answer-normalizer";
import { createPrismaClient } from "../backend/src/infrastructure/database/prisma/client";
import { createApp } from "../backend/src/infrastructure/http/create-app";

type GradingStrategyType = "STRICT" | "PROPORTIONAL";

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

interface StudentSeed {
  name: string;
  cpf: string;
  email: string;
  modifier: number;
}

interface StudentPayload {
  id: string;
  name: string;
  cpf: string;
  email: string;
}

interface GoalSeed {
  name: string;
  description: string;
}

interface GoalPayload {
  id: string;
  name: string;
  description?: string;
}

interface ClassPayload {
  id: string;
  topic: string;
  year: number;
  semester: 1 | 2;
  studentIds: string[];
  goalIds: string[];
}

interface HeaderMetadata {
  discipline: string;
  teacher: string;
  examDate: string;
}

interface ExamTemplatePayload {
  id: string;
  title: string;
  headerMetadata: HeaderMetadata | null;
  alternativeIdentificationType: AlternativeIdentificationType;
  questionsSnapshot: QuestionPayload[];
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
  strategy: GradingStrategyType;
  totalStudents: number;
  averageScore: number;
  students: Array<{
    studentId: string;
    studentName?: string;
    examCode: string;
    totalScore: number;
    percentage: number;
    questionResults: Array<{
      questionPosition: number;
      originalQuestionId: string;
      questionPositionInTemplate: number;
      expectedAnswer: string;
      actualAnswer: string;
      score: number;
      selectedOptionIds: string[];
      wasFullyCorrect: boolean;
    }>;
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
}

interface ClassSeedConfig {
  key: "alpha" | "beta";
  topic: string;
  year: number;
  semester: 1 | 2;
  goals: GoalSeed[];
  students: StudentSeed[];
  templateTitle: string;
  headerMetadata: HeaderMetadata;
  questionUnits: number[];
  alternativeIdentificationType: AlternativeIdentificationType;
  gradingStrategyType: GradingStrategyType;
}

interface SeedSummary {
  generatedAt: string;
  questionsCount: number;
  studentsCount: number;
  goalsCount: number;
  classesCount: number;
  digest: {
    digestDate: string;
    emailsSent: number;
    entriesProcessed: number;
    sampleSubjects: string[];
  };
  classes: Array<{
    id: string;
    topic: string;
    year: number;
    semester: number;
    students: number;
    goals: number;
  }>;
  exams: Array<{
    classKey: string;
    templateId: string;
    templateTitle: string;
    batchId: string;
    examId: string;
    strategy: GradingStrategyType;
    totalStudents: number;
    averageScore: number;
    averagePercentage: number;
    answerKeyCsvPath: string;
    studentResponsesCsvPath: string;
    pdfFiles: string[];
    frontendUrl: string;
    metricsUrl: string;
  }>;
}

class RecordingEmailService implements IEmailService {
  readonly sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<EmailDeliveryReport> {
    this.sent.push(message);

    return {
      accepted: [message.to],
      rejected: [],
      messageId: `recorded-${this.sent.length}`
    };
  }
}

const buildValidCpf = (serial: number): string => {
  const base = serial.toString().padStart(9, "0");
  const digits = base.split("").map(Number);

  const firstVerifier =
    ((digits.reduce((sum, digit, index) => sum + digit * (10 - index), 0) * 10) % 11) % 10;
  const secondVerifier =
    (([...digits, firstVerifier].reduce(
      (sum, digit, index) => sum + digit * (11 - index),
      0
    ) *
      10) %
      11) %
    10;

  return `${base}${firstVerifier}${secondVerifier}`;
};

const QUESTIONS: QuestionSeed[] = [
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

const CLASS_CONFIGS: ClassSeedConfig[] = [
  {
    key: "alpha",
    topic: "Turma Alfa | Fundamentos Matemáticos",
    year: 2026,
    semester: 1,
    goals: [
      {
        name: "Reconhecer frações equivalentes",
        description: "Comparar e simplificar frações em contextos algébricos."
      },
      {
        name: "Resolver equações do 1º grau",
        description: "Isolar incógnitas e validar soluções simples."
      },
      {
        name: "Aplicar propriedades de triângulos",
        description: "Identificar lados, ângulos e classificações básicas."
      },
      {
        name: "Calcular áreas e ângulos complementares",
        description: "Resolver problemas geométricos elementares."
      }
    ],
    students: [
      { name: "Ana Clara Moura", cpf: buildValidCpf(1), email: "ana.alfa01@school.test", modifier: 0.12 },
      { name: "Bruno Lima Costa", cpf: buildValidCpf(2), email: "bruno.alfa02@school.test", modifier: 0.08 },
      { name: "Camila Rocha Alves", cpf: buildValidCpf(3), email: "camila.alfa03@school.test", modifier: 0.05 },
      { name: "Diego Matos Silva", cpf: buildValidCpf(4), email: "diego.alfa04@school.test", modifier: 0.02 },
      { name: "Eduarda Nunes Souza", cpf: buildValidCpf(5), email: "eduarda.alfa05@school.test", modifier: -0.01 },
      { name: "Felipe Costa Melo", cpf: buildValidCpf(6), email: "felipe.alfa06@school.test", modifier: -0.04 },
      { name: "Gabriela Ramos", cpf: buildValidCpf(7), email: "gabriela.alfa07@school.test", modifier: -0.07 },
      { name: "Henrique Torres", cpf: buildValidCpf(8), email: "henrique.alfa08@school.test", modifier: -0.1 },
      { name: "Isabela Duarte", cpf: buildValidCpf(9), email: "isabela.alfa09@school.test", modifier: -0.13 },
      { name: "João Pedro Maia", cpf: buildValidCpf(10), email: "joao.alfa10@school.test", modifier: -0.16 }
    ],
    templateTitle: "[MACRO] Turma Alfa - Avaliação Bimestral",
    headerMetadata: {
      discipline: "Matemática",
      teacher: "Profa. Helena Duarte",
      examDate: "2026-05-15"
    },
    questionUnits: [1, 2],
    alternativeIdentificationType: AlternativeIdentificationType.LETTERS,
    gradingStrategyType: "STRICT"
  },
  {
    key: "beta",
    topic: "Turma Beta | Matemática Aplicada",
    year: 2026,
    semester: 1,
    goals: [
      {
        name: "Interpretar probabilidade simples",
        description: "Analisar chances em experimentos aleatórios básicos."
      },
      {
        name: "Ler gráficos e tendências centrais",
        description: "Interpretar dados e comparar medidas estatísticas."
      },
      {
        name: "Resolver funções afins e quadráticas",
        description: "Ler pares ordenados e calcular imagens de funções."
      },
      {
        name: "Aplicar porcentagem em contextos reais",
        description: "Resolver aumentos e descontos percentuais."
      }
    ],
    students: [
      { name: "Larissa Gomes", cpf: buildValidCpf(11), email: "larissa.beta01@school.test", modifier: 0.11 },
      { name: "Mateus Vieira", cpf: buildValidCpf(12), email: "mateus.beta02@school.test", modifier: 0.07 },
      { name: "Nathalia Reis", cpf: buildValidCpf(13), email: "nathalia.beta03@school.test", modifier: 0.04 },
      { name: "Otávio Monteiro", cpf: buildValidCpf(14), email: "otavio.beta04@school.test", modifier: 0.01 },
      { name: "Paula Siqueira", cpf: buildValidCpf(15), email: "paula.beta05@school.test", modifier: -0.02 },
      { name: "Rafael Guerra", cpf: buildValidCpf(16), email: "rafael.beta06@school.test", modifier: -0.05 },
      { name: "Sofia Andrade", cpf: buildValidCpf(17), email: "sofia.beta07@school.test", modifier: -0.08 },
      { name: "Thiago Martins", cpf: buildValidCpf(18), email: "thiago.beta08@school.test", modifier: -0.11 },
      { name: "Valentina Azevedo", cpf: buildValidCpf(19), email: "valentina.beta09@school.test", modifier: -0.14 },
      { name: "Yuri Fernandes", cpf: buildValidCpf(20), email: "yuri.beta10@school.test", modifier: -0.17 }
    ],
    templateTitle: "[MACRO] Turma Beta - Avaliação Bimestral",
    headerMetadata: {
      discipline: "Matemática",
      teacher: "Prof. Ricardo Teixeira",
      examDate: "2026-05-16"
    },
    questionUnits: [3, 4],
    alternativeIdentificationType: AlternativeIdentificationType.POWERS_OF_2,
    gradingStrategyType: "PROPORTIONAL"
  }
];

const BASE_ACCURACY_BY_UNIT: Record<number, number> = {
  1: 0.88,
  2: 0.79,
  3: 0.63,
  4: 0.74
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

const buildClassKey = (topic: string, year: number, semester: number): string =>
  `${topic}::${year}.${semester}`;

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

const ensureStudent = async (
  app: ReturnType<typeof createApp>,
  seed: StudentSeed,
  existingStudent?: StudentPayload
): Promise<StudentPayload> => {
  const payload = {
    name: seed.name,
    cpf: seed.cpf,
    email: seed.email
  };

  if (existingStudent) {
    const response = await request(app).put(`/students/${existingStudent.id}`).send(payload);
    assertStatus(response.status, 200, `Atualização do aluno ${existingStudent.id}`, response.body);
    return response.body as StudentPayload;
  }

  const response = await request(app).post("/students").send(payload);
  assertStatus(response.status, 201, `Criação do aluno ${seed.email}`, response.body);
  return response.body as StudentPayload;
};

const ensureGoal = async (
  app: ReturnType<typeof createApp>,
  seed: GoalSeed,
  existingGoal?: GoalPayload
): Promise<GoalPayload> => {
  if (existingGoal) {
    const response = await request(app).put(`/goals/${existingGoal.id}`).send(seed);
    assertStatus(response.status, 200, `Atualização da meta ${existingGoal.id}`, response.body);
    return response.body as GoalPayload;
  }

  const response = await request(app).post("/goals").send(seed);
  assertStatus(response.status, 201, `Criação da meta ${seed.name}`, response.body);
  return response.body as GoalPayload;
};

const ensureClassGroup = async (
  app: ReturnType<typeof createApp>,
  config: ClassSeedConfig,
  studentIds: string[],
  goalIds: string[],
  existingClass?: ClassPayload
): Promise<ClassPayload> => {
  const payload = {
    topic: config.topic,
    year: config.year,
    semester: config.semester,
    studentIds,
    goalIds
  };

  if (existingClass) {
    const response = await request(app).put(`/classes/${existingClass.id}`).send(payload);
    assertStatus(response.status, 200, `Atualização da turma ${existingClass.id}`, response.body);
    return response.body as ClassPayload;
  }

  const response = await request(app).post("/classes").send(payload);
  assertStatus(response.status, 201, `Criação da turma ${config.topic}`, response.body);
  return response.body as ClassPayload;
};

const ensureExamTemplate = async (
  app: ReturnType<typeof createApp>,
  config: ClassSeedConfig,
  questionIds: string[]
): Promise<ExamTemplatePayload> => {
  const listResponse = await request(app).get("/exam-templates");
  assertStatus(listResponse.status, 200, "Listagem de modelos de prova", listResponse.body);

  const existingTemplate = (listResponse.body as ExamTemplatePayload[]).find(
    (examTemplate) => examTemplate.title === config.templateTitle
  );

  const payload = {
    title: config.templateTitle,
    headerMetadata: config.headerMetadata,
    questionIds,
    alternativeIdentificationType: config.alternativeIdentificationType
  };

  if (existingTemplate) {
    const response = await request(app)
      .put(`/exam-templates/${existingTemplate.id}`)
      .send(payload);
    assertStatus(response.status, 200, `Atualização do template ${existingTemplate.id}`, response.body);
    return response.body as ExamTemplatePayload;
  }

  const response = await request(app).post("/exam-templates").send(payload);
  assertStatus(response.status, 201, `Criação do template ${config.templateTitle}`, response.body);
  return response.body as ExamTemplatePayload;
};

const determineEvaluationLevel = (
  classKey: string,
  student: StudentSeed,
  goal: GoalSeed
): EvaluationLevel => {
  const random = createDeterministicRandom(`${classKey}:${student.email}:${goal.name}:evaluation`);
  const score = clamp(0.55 + student.modifier + (random() - 0.5) * 0.3, 0, 1);

  if (score >= 0.72) {
    return "MA";
  }

  if (score >= 0.45) {
    return "MPA";
  }

  return "MANA";
};

const buildStudentStates = (
  classKey: string,
  student: StudentSeed,
  question: GeneratedExamInstancePayload["randomizedQuestions"][number],
  unit: number
): boolean[] => {
  const expectedStates = question.randomizedOptions.map((option) => option.isCorrect);
  const random = createDeterministicRandom(
    `${classKey}:${student.email}:${question.originalQuestionId}:${unit}:answer`
  );
  const questionDrift = (random() - 0.5) * 0.08;
  const accuracy = clamp(
    (BASE_ACCURACY_BY_UNIT[unit] ?? 0.7) + student.modifier + questionDrift,
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

const buildStudentResponsesCsv = (
  classKey: string,
  students: StudentSeed[],
  instances: GeneratedExamInstancePayload[],
  questionLookup: Map<string, QuestionPayload>
): string => {
  const questionHeaders = instances[0]?.randomizedQuestions
    .slice()
    .sort((left, right) => left.position - right.position)
    .map((question) => `q${question.position}`) ?? [];

  const rows: string[][] = [["studentId", "studentName", "examCode", ...questionHeaders]];

  instances
    .slice()
    .sort((left, right) => left.examCode.localeCompare(right.examCode))
    .forEach((instance, index) => {
      const student = students[index];
      if (!student) {
        return;
      }

      const orderedQuestions = instance.randomizedQuestions
        .slice()
        .sort((left, right) => left.position - right.position);

      rows.push([
        student.cpf,
        student.name,
        instance.examCode,
        ...orderedQuestions.map((question) => {
          const originalQuestion = questionLookup.get(question.originalQuestionId);
          if (!originalQuestion) {
            throw new Error(`Questão original não encontrada: ${question.originalQuestionId}`);
          }

          const actualStates = buildStudentStates(classKey, student, question, originalQuestion.unit);
          return buildDisplayAnswer(actualStates, question, instance.alternativeIdentificationType);
        })
      ]);
    });

  return stringifyCsv(rows);
};

const normalizeGradePayload = (payload: GradeResponsePayload) => ({
  strategy: payload.strategy,
  totalStudents: payload.totalStudents,
  averageScore: Number(payload.averageScore.toFixed(6)),
  students: payload.students
    .slice()
    .sort((left, right) => left.studentId.localeCompare(right.studentId))
    .map((student) => ({
      studentId: student.studentId,
      studentName: student.studentName ?? null,
      examCode: student.examCode,
      totalScore: Number(student.totalScore.toFixed(6)),
      percentage: Number(student.percentage.toFixed(6)),
      questionResults: student.questionResults
        .slice()
        .sort((left, right) => left.questionPosition - right.questionPosition)
        .map((question) => ({
          questionPosition: question.questionPosition,
          originalQuestionId: question.originalQuestionId,
          questionPositionInTemplate: question.questionPositionInTemplate,
          expectedAnswer: question.expectedAnswer,
          actualAnswer: question.actualAnswer,
          score: Number(question.score.toFixed(6)),
          selectedOptionIds: question.selectedOptionIds.slice().sort(),
          wasFullyCorrect: question.wasFullyCorrect
        }))
    }))
});

const gradeExamTwiceAndAssertDeterminism = async (
  app: ReturnType<typeof createApp>,
  gradingStrategyType: GradingStrategyType,
  answerKeyAbsolutePath: string,
  studentResponsesCsv: string,
  fileSuffix: string
): Promise<GradeResponsePayload> => {
  const answerKeyBuffer = await fs.readFile(answerKeyAbsolutePath);

  const executeGrade = async (): Promise<GradeResponsePayload> => {
    const response = await request(app)
      .post("/exams/grade")
      .field("gradingStrategyType", gradingStrategyType)
      .attach("answerKeyFile", answerKeyBuffer, {
        filename: path.basename(answerKeyAbsolutePath),
        contentType: "text/csv"
      })
      .attach("studentResponsesFile", Buffer.from(studentResponsesCsv, "utf-8"), {
        filename: `student-responses-${fileSuffix}.csv`,
        contentType: "text/csv"
      });

    assertStatus(response.status, 200, `Correção (${gradingStrategyType})`, response.body);
    return response.body as GradeResponsePayload;
  };

  const first = await executeGrade();
  const second = await executeGrade();

  assert.deepEqual(
    normalizeGradePayload(first),
    normalizeGradePayload(second),
    `A correção ${gradingStrategyType} deixou de ser determinística.`
  );

  return first;
};

const main = async (): Promise<void> => {
  const prismaClient = createPrismaClient();
  const emailService = new RecordingEmailService();

  await prismaClient.$connect();

  try {
    const app = createApp({
      prismaClient,
      emailService,
      jsonStorageDir: path.resolve(process.cwd(), "data"),
      artifactsBaseDir: path.resolve(process.cwd(), "output/exam-batches"),
      emailFromAddress: "pedagogico@education-analytics.local"
    });

    const questionsResponse = await request(app).get("/questions");
    assertStatus(questionsResponse.status, 200, "Listagem de questões", questionsResponse.body);
    const existingQuestions = new Map<string, QuestionPayload>(
      (questionsResponse.body as QuestionPayload[]).map((question) => [
        buildQuestionKey(question),
        question
      ])
    );

    const studentsResponse = await request(app).get("/students");
    assertStatus(studentsResponse.status, 200, "Listagem de alunos", studentsResponse.body);
    const existingStudents = new Map<string, StudentPayload>(
      (studentsResponse.body as StudentPayload[]).map((student) => [student.email, student])
    );

    const goalsResponse = await request(app).get("/goals");
    assertStatus(goalsResponse.status, 200, "Listagem de metas", goalsResponse.body);
    const existingGoals = new Map<string, GoalPayload>(
      (goalsResponse.body as GoalPayload[]).map((goal) => [goal.name, goal])
    );

    const classesResponse = await request(app).get("/classes");
    assertStatus(classesResponse.status, 200, "Listagem de turmas", classesResponse.body);
    const existingClasses = new Map<string, ClassPayload>(
      (classesResponse.body as ClassPayload[]).map((classGroup) => [
        buildClassKey(classGroup.topic, classGroup.year, classGroup.semester),
        classGroup
      ])
    );

    const ensuredQuestions: QuestionPayload[] = [];
    for (const question of QUESTIONS) {
      const ensured = await ensureQuestion(
        app,
        question,
        existingQuestions.get(buildQuestionKey(question))
      );
      ensuredQuestions.push(ensured);
    }

    const questionLookup = new Map(ensuredQuestions.map((question) => [question.id, question]));
    const examsSummary: SeedSummary["exams"] = [];
    const classesSummary: SeedSummary["classes"] = [];
    const allGoals: GoalPayload[] = [];
    const allStudents: StudentPayload[] = [];

    for (const config of CLASS_CONFIGS) {
      const ensuredStudents: StudentPayload[] = [];
      for (const student of config.students) {
        const ensured = await ensureStudent(app, student, existingStudents.get(student.email));
        existingStudents.set(student.email, ensured);
        ensuredStudents.push(ensured);
        allStudents.push(ensured);
      }

      const ensuredGoals: GoalPayload[] = [];
      for (const goal of config.goals) {
        const ensured = await ensureGoal(app, goal, existingGoals.get(goal.name));
        existingGoals.set(goal.name, ensured);
        ensuredGoals.push(ensured);
        allGoals.push(ensured);
      }

      const classGroup = await ensureClassGroup(
        app,
        config,
        ensuredStudents.map((student) => student.id),
        ensuredGoals.map((goal) => goal.id),
        existingClasses.get(buildClassKey(config.topic, config.year, config.semester))
      );

      classesSummary.push({
        id: classGroup.id,
        topic: classGroup.topic,
        year: classGroup.year,
        semester: classGroup.semester,
        students: classGroup.studentIds.length,
        goals: classGroup.goalIds.length
      });

      for (const student of config.students) {
        const persistedStudent = ensuredStudents.find((item) => item.email === student.email);
        if (!persistedStudent) {
          throw new Error(`Aluno não encontrado após criação: ${student.email}`);
        }

        for (const goal of config.goals) {
          const persistedGoal = ensuredGoals.find((item) => item.name === goal.name);
          if (!persistedGoal) {
            throw new Error(`Meta não encontrada após criação: ${goal.name}`);
          }

          const evaluationResponse = await request(app)
            .put(`/classes/${classGroup.id}/evaluations`)
            .send({
              studentId: persistedStudent.id,
              goalId: persistedGoal.id,
              level: determineEvaluationLevel(config.key, student, goal)
            });

          assertStatus(
            evaluationResponse.status,
            200,
            `Avaliação ${persistedStudent.email} -> ${persistedGoal.name}`,
            evaluationResponse.body
          );
        }
      }

      const templateQuestions = ensuredQuestions.filter((question) =>
        config.questionUnits.includes(question.unit)
      );

      const template = await ensureExamTemplate(
        app,
        config,
        templateQuestions.map((question) => question.id)
      );

      const generationResponse = await request(app)
        .post(`/exam-templates/${template.id}/generate`)
        .send({ quantity: config.students.length });

      assertStatus(
        generationResponse.status,
        201,
        `Geração de provas para ${config.templateTitle}`,
        generationResponse.body
      );

      const batchId = generationResponse.body.batchId as string;
      const instances = generationResponse.body.instances as GeneratedExamInstancePayload[];
      const artifacts = generationResponse.body.artifacts as GeneratedArtifactPayload[];
      const answerKeyArtifact = artifacts.find((artifact) => artifact.kind === "CSV");

      if (!answerKeyArtifact) {
        throw new Error(`O gabarito CSV não foi retornado para ${config.templateTitle}.`);
      }

      const outputDir = path.dirname(answerKeyArtifact.absolutePath);
      const studentResponsesCsv = buildStudentResponsesCsv(
        config.key,
        config.students,
        instances,
        questionLookup
      );
      const studentResponsesCsvPath = path.resolve(
        outputDir,
        `student-responses-${batchId}.csv`
      );
      await fs.writeFile(studentResponsesCsvPath, studentResponsesCsv, "utf-8");

      const gradePayload = await gradeExamTwiceAndAssertDeterminism(
        app,
        config.gradingStrategyType,
        answerKeyArtifact.absolutePath,
        studentResponsesCsv,
        batchId
      );

      const metricsResponse = await request(app).get(`/exams/${gradePayload.examId}/metrics`);
      assertStatus(metricsResponse.status, 200, "Leitura das métricas", metricsResponse.body);
      const metricsPayload = metricsResponse.body as MetricsResponsePayload;

      const insightsResponse = await request(app).get(`/exams/${gradePayload.examId}/insights`);
      assertStatus(insightsResponse.status, 200, "Leitura dos insights", insightsResponse.body);

      examsSummary.push({
        classKey: config.key,
        templateId: template.id,
        templateTitle: template.title,
        batchId,
        examId: gradePayload.examId,
        strategy: gradePayload.strategy,
        totalStudents: gradePayload.totalStudents,
        averageScore: Number(metricsPayload.summary.averageScore.toFixed(2)),
        averagePercentage: Number(metricsPayload.summary.averagePercentage.toFixed(2)),
        answerKeyCsvPath: answerKeyArtifact.absolutePath,
        studentResponsesCsvPath,
        pdfFiles: artifacts
          .filter((artifact) => artifact.kind === "PDF")
          .map((artifact) => artifact.absolutePath),
        frontendUrl: `http://127.0.0.1:5173/exams/${gradePayload.examId}`,
        metricsUrl: `http://127.0.0.1:3000/exams/${gradePayload.examId}/metrics`
      });
    }

    const digestResponse = await request(app).post("/email/digest").send({});
    assertStatus(digestResponse.status, 200, "Processamento do digest pedagógico", digestResponse.body);

    const summary: SeedSummary = {
      generatedAt: new Date().toISOString(),
      questionsCount: ensuredQuestions.length,
      studentsCount: new Set(allStudents.map((student) => student.email)).size,
      goalsCount: new Set(allGoals.map((goal) => goal.name)).size,
      classesCount: classesSummary.length,
      digest: {
        digestDate: digestResponse.body.digestDate as string,
        emailsSent: digestResponse.body.emailsSent as number,
        entriesProcessed: digestResponse.body.entriesProcessed as number,
        sampleSubjects: emailService.sent.slice(0, 3).map((message) => message.subject)
      },
      classes: classesSummary,
      exams: examsSummary
    };

    await fs.mkdir(path.resolve(process.cwd(), "output"), { recursive: true });
    await fs.writeFile(
      path.resolve(process.cwd(), "output/full-system-seed-summary.json"),
      JSON.stringify(summary, null, 2),
      "utf-8"
    );

    console.log("\nCarga macro do sistema criada com sucesso.\n");
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prismaClient.$disconnect();
  }
};

main().catch((error) => {
  console.error("\nFalha ao popular o sistema por completo.\n");
  console.error(error);
  process.exit(1);
});
