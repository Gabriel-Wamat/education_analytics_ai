import { Then, When } from "@cucumber/cucumber";
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
      alternativeIdentificationType
    });

    const createdExamTemplate = this.response.body as { id?: string };
    if (createdExamTemplate.id) {
      this.examTemplateId = createdExamTemplate.id;
    }
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
