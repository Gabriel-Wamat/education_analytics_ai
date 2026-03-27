import { Then, When } from "@cucumber/cucumber";
import { randomUUID } from "node:crypto";
import request from "supertest";

import { getTestContext } from "../support/test-context";
import { AcceptanceWorld } from "../support/world";

When(
  "eu criar uma prova com o título {string} usando as questões cadastradas e o tipo de alternativa {string}",
  async function (
    this: AcceptanceWorld,
    title: string,
    alternativeIdentificationType: string
  ) {
    const { app } = getTestContext();

    this.response = await request(app).post("/exam-templates").send({
      title,
      questionIds: this.questionIds,
      alternativeIdentificationType,
      headerMetadata: {
        discipline: "Matemática",
        teacher: "Prof. Ada Lovelace",
        examDate: "2026-04-10"
      }
    });

    const createdExamTemplate = this.response.body as { id?: string };
    if (createdExamTemplate.id) {
      this.examTemplateId = createdExamTemplate.id;
    }
  }
);

When(
  "eu criar um modelo de prova legado sem cabeçalho com o título {string}",
  async function (this: AcceptanceWorld, title: string) {
    const { prismaClient } = getTestContext();
    const now = new Date();

    const questions = await prismaClient.question.findMany({
      where: { id: { in: this.questionIds } },
      include: { options: true }
    });

    const examTemplate = await prismaClient.examTemplate.create({
      data: {
        id: randomUUID(),
        title,
        headerMetadata: null,
        alternativeIdentificationType: "LETTERS",
        questionsSnapshot: questions.map((question) => ({
          id: question.id,
          topic: question.topic,
          unit: question.unit,
          statement: question.statement,
          options: question.options.map((option) => ({
            id: option.id,
            description: option.description,
            isCorrect: option.isCorrect
          })),
          createdAt: question.createdAt.toISOString(),
          updatedAt: question.updatedAt.toISOString()
        })),
        createdAt: now,
        updatedAt: now
      }
    });

    this.examTemplateId = examTemplate.id;
  }
);

When("eu consultar a prova cadastrada", async function (this: AcceptanceWorld) {
  const { app } = getTestContext();
  this.response = await request(app).get(`/exam-templates/${this.examTemplateId}`);
});

Then(
  "a prova retornada deve ter o título {string}",
  function (this: AcceptanceWorld, expectedTitle: string) {
    const payload = this.response?.body as { title: string };

    if (payload.title !== expectedTitle) {
      throw new Error(
        `Título inesperado. Esperado: ${expectedTitle}. Recebido: ${payload.title}.`
      );
    }
  }
);

Then(
  "a prova retornada deve usar o tipo de alternativa {string}",
  function (this: AcceptanceWorld, expectedType: string) {
    const payload = this.response?.body as { alternativeIdentificationType: string };

    if (payload.alternativeIdentificationType !== expectedType) {
      throw new Error(
        `Tipo de alternativa inesperado. Esperado: ${expectedType}. Recebido: ${payload.alternativeIdentificationType}.`
      );
    }
  }
);

Then(
  "a prova retornada deve conter {int} questões no snapshot",
  function (this: AcceptanceWorld, expectedQuestionsCount: number) {
    const payload = this.response?.body as { questionsSnapshot: unknown[] };

    if (payload.questionsSnapshot.length !== expectedQuestionsCount) {
      throw new Error(
        `Quantidade de questões inesperada. Esperado: ${expectedQuestionsCount}. Recebido: ${payload.questionsSnapshot.length}.`
      );
    }
  }
);

Then(
  "a prova retornada deve ter disciplina {string}, professor {string} e data {string}",
  function (
    this: AcceptanceWorld,
    expectedDiscipline: string,
    expectedTeacher: string,
    expectedDate: string
  ) {
    const payload = this.response?.body as {
      headerMetadata?: { discipline: string; teacher: string; examDate: string };
    };

    if (!payload.headerMetadata) {
      throw new Error("A prova retornada não possui headerMetadata.");
    }

    if (payload.headerMetadata.discipline !== expectedDiscipline) {
      throw new Error(
        `Disciplina inesperada. Esperado: ${expectedDiscipline}. Recebido: ${payload.headerMetadata.discipline}.`
      );
    }

    if (payload.headerMetadata.teacher !== expectedTeacher) {
      throw new Error(
        `Professor inesperado. Esperado: ${expectedTeacher}. Recebido: ${payload.headerMetadata.teacher}.`
      );
    }

    if (payload.headerMetadata.examDate !== expectedDate) {
      throw new Error(
        `Data inesperada. Esperado: ${expectedDate}. Recebido: ${payload.headerMetadata.examDate}.`
      );
    }
  }
);

Then(
  "o snapshot da prova deve manter o enunciado original {string}",
  function (this: AcceptanceWorld, expectedStatement: string) {
    const payload = this.response?.body as {
      questionsSnapshot: Array<{ statement: string }>;
    };

    if (payload.questionsSnapshot[0]?.statement !== expectedStatement) {
      throw new Error(
        `O snapshot não preservou o enunciado original. Esperado: ${expectedStatement}. Recebido: ${payload.questionsSnapshot[0]?.statement}.`
      );
    }
  }
);
