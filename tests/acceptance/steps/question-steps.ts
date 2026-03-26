import { DataTable, Given, Then, When } from "@cucumber/cucumber";
import request from "supertest";

import { getTestContext } from "../support/test-context";
import { AcceptanceWorld } from "../support/world";

interface OptionRow {
  description: string;
  isCorrect: string;
}

const defaultQuestionMetadata = {
  topic: "Tema padrão",
  unit: 1
};

const parseOptions = (table: DataTable) =>
  table.hashes<OptionRow>().map((option) => ({
    description: option.description,
    isCorrect: option.isCorrect === "true"
  }));

const createQuestionThroughApi = async (
  statement: string,
  table: DataTable,
  world: AcceptanceWorld
): Promise<void> => {
  const { app } = getTestContext();

  world.response = await request(app).post("/questions").send({
    ...defaultQuestionMetadata,
    statement,
    options: parseOptions(table)
  });

  const createdQuestion = world.response.body as { id: string };
  if (world.response.status === 201 && createdQuestion.id) {
    world.questionIds.push(createdQuestion.id);
  }
};

Given(
  "que existe uma questão cadastrada com o enunciado {string} e as alternativas:",
  async function (this: AcceptanceWorld, statement: string, table: DataTable) {
    await createQuestionThroughApi(statement, table, this);
  }
);

When(
  "eu cadastrar uma questão com o enunciado {string} e as alternativas:",
  async function (this: AcceptanceWorld, statement: string, table: DataTable) {
    await createQuestionThroughApi(statement, table, this);
  }
);

When(
  "eu tentar cadastrar uma questão inválida com o enunciado {string} e as alternativas:",
  async function (this: AcceptanceWorld, statement: string, table: DataTable) {
    const { app } = getTestContext();

    this.response = await request(app).post("/questions").send({
      ...defaultQuestionMetadata,
      statement,
      options: parseOptions(table)
    });
  }
);

When(
  "eu atualizar a questão cadastrada para o enunciado {string} e as alternativas:",
  async function (this: AcceptanceWorld, statement: string, table: DataTable) {
    const { app } = getTestContext();
    const questionId = this.questionIds.at(-1);

    this.response = await request(app).put(`/questions/${questionId}`).send({
      ...defaultQuestionMetadata,
      statement,
      options: parseOptions(table)
    });
  }
);

When(
  "eu atualizar a questão original para o enunciado {string} e as alternativas:",
  async function (this: AcceptanceWorld, statement: string, table: DataTable) {
    const { app } = getTestContext();
    const questionId = this.questionIds[0];

    this.response = await request(app).put(`/questions/${questionId}`).send({
      ...defaultQuestionMetadata,
      statement,
      options: parseOptions(table)
    });
  }
);

When("eu remover a questão cadastrada", async function (this: AcceptanceWorld) {
  const { app } = getTestContext();
  const questionId = this.questionIds.at(-1);

  this.deletedQuestionId = questionId;
  this.response = await request(app).delete(`/questions/${questionId}`);
});

When("eu consultar a questão cadastrada removida", async function (this: AcceptanceWorld) {
  const { app } = getTestContext();

  this.response = await request(app).get(`/questions/${this.deletedQuestionId}`);
});

Then("a resposta deve ter status {int}", function (this: AcceptanceWorld, statusCode: number) {
  if (!this.response) {
    throw new Error("Nenhuma resposta HTTP foi registrada para validação.");
  }

  if (this.response.status !== statusCode) {
    throw new Error(
      `Status inesperado. Esperado: ${statusCode}. Recebido: ${this.response.status}.`
    );
  }
});

Then(
  "a questão retornada deve ter o enunciado {string}",
  function (this: AcceptanceWorld, expectedStatement: string) {
    const payload = this.response?.body as { statement: string };

    if (payload.statement !== expectedStatement) {
      throw new Error(
        `Enunciado inesperado. Esperado: ${expectedStatement}. Recebido: ${payload.statement}.`
      );
    }
  }
);

Then(
  "a questão retornada deve conter {int} alternativas",
  function (this: AcceptanceWorld, expectedOptionsCount: number) {
    const payload = this.response?.body as { options: unknown[] };

    if (payload.options.length !== expectedOptionsCount) {
      throw new Error(
        `Quantidade de alternativas inesperada. Esperado: ${expectedOptionsCount}. Recebido: ${payload.options.length}.`
      );
    }
  }
);

Then(
  "a questão retornada deve ter exatamente {int} alternativa correta",
  function (this: AcceptanceWorld, expectedCorrectOptionsCount: number) {
    const payload = this.response?.body as { options: Array<{ isCorrect: boolean }> };
    const currentCorrectOptionsCount = payload.options.filter((option) => option.isCorrect).length;

    if (currentCorrectOptionsCount !== expectedCorrectOptionsCount) {
      throw new Error(
        `Quantidade de alternativas corretas inesperada. Esperado: ${expectedCorrectOptionsCount}. Recebido: ${currentCorrectOptionsCount}.`
      );
    }
  }
);

Then(
  "a mensagem de erro deve ser {string}",
  function (this: AcceptanceWorld, expectedMessage: string) {
    const payload = this.response?.body as { message?: string };

    if (payload.message !== expectedMessage) {
      throw new Error(
        `Mensagem de erro inesperada. Esperado: ${expectedMessage}. Recebido: ${payload.message}.`
      );
    }
  }
);

Then(
  "os detalhes do erro devem conter {string}",
  function (this: AcceptanceWorld, expectedDetail: string) {
    const payload = this.response?.body as { details?: string[] };
    const details = payload.details ?? [];

    if (!details.includes(expectedDetail)) {
      throw new Error(
        `Detalhe de erro não encontrado. Esperado: ${expectedDetail}. Recebido: ${details.join(", ")}.`
      );
    }
  }
);
