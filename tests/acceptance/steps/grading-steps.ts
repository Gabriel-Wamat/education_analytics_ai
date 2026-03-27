import fs from "node:fs/promises";

import { Given, Then, When } from "@cucumber/cucumber";
import request from "supertest";

import { getTestContext } from "../support/test-context";
import { AcceptanceWorld } from "../support/world";

interface GeneratedExamInstancePayload {
  examCode: string;
  alternativeIdentificationType: string;
  randomizedQuestions: Array<{
    position: number;
    randomizedOptions: Array<{
      displayCode: string;
      isCorrect: boolean;
    }>;
  }>;
}

const buildQuestionOptions = (totalAlternatives: number, correctAlternatives: number) =>
  Array.from({ length: totalAlternatives }, (_, index) => ({
    description: `Opcao ${index + 1}`,
    isCorrect: index < correctAlternatives
  }));

const buildAnswerFromStates = (
  instance: GeneratedExamInstancePayload,
  states: boolean[]
): string => {
  const question = instance.randomizedQuestions[0];
  const selectedCodes = question.randomizedOptions
    .filter((_, index) => states[index])
    .map((option) => option.displayCode);

  if (selectedCodes.length === 0) {
    return "";
  }

  if (instance.alternativeIdentificationType === "LETTERS") {
    return selectedCodes.join("|");
  }

  return String(selectedCodes.reduce((total, value) => total + Number(value), 0));
};

const buildModifiedStates = (expectedStates: boolean[], matchingStates: number): boolean[] => {
  const actualStates = [...expectedStates];
  const mismatches = expectedStates.length - matchingStates;

  for (let index = 0; index < mismatches; index += 1) {
    actualStates[index] = !actualStates[index];
  }

  return actualStates;
};

const createGeneratedExamFixture = async (
  world: AcceptanceWorld,
  totalAlternatives: number,
  correctAlternatives: number,
  alternativeIdentificationType: string
): Promise<void> => {
  const { app } = getTestContext();

  const questionResponse = await request(app).post("/questions").send({
    topic: "Tema de correção",
    unit: 1,
    statement: `Questão com ${totalAlternatives} alternativas`,
    options: buildQuestionOptions(totalAlternatives, correctAlternatives)
  });

  const questionId = questionResponse.body.id as string;
  world.questionIds = [questionId];

  const examTemplateResponse = await request(app).post("/exam-templates").send({
    title: `Modelo ${alternativeIdentificationType}`,
    questionIds: [questionId],
    alternativeIdentificationType,
    headerMetadata: {
      discipline: "Matemática",
      teacher: "Prof. Ada Lovelace",
      examDate: "2026-04-10"
    }
  });

  world.examTemplateId = examTemplateResponse.body.id as string;

  const generationResponse = await request(app)
    .post(`/exam-templates/${world.examTemplateId}/generate`)
    .send({ quantity: 1 });

  world.response = generationResponse;
  world.batchId = generationResponse.body.batchId as string;
  world.generatedInstances = generationResponse.body.instances as Array<Record<string, unknown>>;
  world.generatedArtifacts = generationResponse.body.artifacts as Array<Record<string, unknown>>;
  world.answerKeyArtifactPath = (
    generationResponse.body.artifacts as Array<{ kind: string; absolutePath: string }>
  ).find((artifact) => artifact.kind === "CSV")?.absolutePath;
};

const submitGradeRequest = async (
  world: AcceptanceWorld,
  markedAnswer: string,
  gradingStrategyType: string
): Promise<void> => {
  const { app } = getTestContext();

  if (!world.answerKeyArtifactPath) {
    throw new Error("O gabarito CSV não foi gerado.");
  }

  const answerKeyBuffer = await fs.readFile(world.answerKeyArtifactPath);
  const instance = world.generatedInstances[0] as GeneratedExamInstancePayload;
  const studentResponseCsv = [
    "studentId,studentName,examCode,q1",
    `ALUNO-1,Ana,${instance.examCode},${markedAnswer}`
  ].join("\n");

  world.response = await request(app)
    .post("/exams/grade")
    .field("gradingStrategyType", gradingStrategyType)
    .attach("answerKeyFile", answerKeyBuffer, {
      filename: "answer-key.csv",
      contentType: "text/csv"
    })
    .attach("studentResponsesFile", Buffer.from(studentResponseCsv, "utf-8"), {
      filename: "student-responses.csv",
      contentType: "text/csv"
    });

  world.examId = world.response.body.examId as string | undefined;
};

Given(
  "que existe uma instância de prova com 1 questão, {int} alternativas, {int} corretas e identificação {string}",
  async function (
    this: AcceptanceWorld,
    totalAlternatives: number,
    correctAlternatives: number,
    alternativeIdentificationType: string
  ) {
    await createGeneratedExamFixture(
      this,
      totalAlternatives,
      correctAlternatives,
      alternativeIdentificationType
    );
  }
);

When(
  "eu corrigir as respostas de um aluno com {int} estados corretos de {int} usando a estratégia {string}",
  async function (
    this: AcceptanceWorld,
    matchingStates: number,
    totalStates: number,
    gradingStrategyType: string
  ) {
    const instance = this.generatedInstances[0] as GeneratedExamInstancePayload;
    const question = instance.randomizedQuestions[0];

    if (question.randomizedOptions.length !== totalStates) {
      throw new Error(
        `Total de estados inesperado. Esperado: ${totalStates}. Recebido: ${question.randomizedOptions.length}.`
      );
    }

    const expectedStates = question.randomizedOptions.map((option) => option.isCorrect);
    const actualStates = buildModifiedStates(expectedStates, matchingStates);
    const markedAnswer = buildAnswerFromStates(instance, actualStates);

    await submitGradeRequest(this, markedAnswer, gradingStrategyType);
  }
);

When(
  "eu corrigir uma resposta em branco usando a estratégia {string}",
  async function (this: AcceptanceWorld, gradingStrategyType: string) {
    await submitGradeRequest(this, "", gradingStrategyType);
  }
);

Then(
  "o relatório deve conter {int} aluno corrigido",
  function (this: AcceptanceWorld, expectedStudents: number) {
    const payload = this.response?.body as { totalStudents: number };

    if (payload.totalStudents !== expectedStudents) {
      throw new Error(
        `Quantidade inesperada de alunos corrigidos. Esperado: ${expectedStudents}. Recebido: ${payload.totalStudents}.`
      );
    }
  }
);

Then(
  "a nota da primeira questão do primeiro aluno deve ser {float}",
  function (this: AcceptanceWorld, expectedScore: number) {
    const payload = this.response?.body as {
      students: Array<{ questionResults: Array<{ score: number }> }>;
    };

    const actualScore = payload.students[0]?.questionResults[0]?.score;
    if (Math.abs(actualScore - expectedScore) > 0.0001) {
      throw new Error(
        `Nota da primeira questão inesperada. Esperado: ${expectedScore}. Recebido: ${actualScore}.`
      );
    }
  }
);

Then(
  "a nota total do primeiro aluno deve ser {float}",
  function (this: AcceptanceWorld, expectedScore: number) {
    const payload = this.response?.body as {
      students: Array<{ totalScore: number }>;
    };

    const actualScore = payload.students[0]?.totalScore;
    if (Math.abs(actualScore - expectedScore) > 0.0001) {
      throw new Error(
        `Nota total inesperada. Esperado: ${expectedScore}. Recebido: ${actualScore}.`
      );
    }
  }
);
