import fs from "node:fs/promises";

import { Then, When } from "@cucumber/cucumber";
import request from "supertest";

import { getTestContext } from "../support/test-context";
import { AcceptanceWorld } from "../support/world";

interface GeneratedExamInstancePayload {
  examCode: string;
  signature: string;
  alternativeIdentificationType: string;
  randomizedQuestions: Array<{
    originalQuestionId: string;
    position: number;
    statement: string;
    randomizedOptions: Array<{
      originalOptionId: string;
      position: number;
      displayCode: string;
      isCorrect: boolean;
    }>;
  }>;
}

interface GeneratedArtifactPayload {
  kind: string;
  fileName: string;
  absolutePath: string;
  mimeType: string;
}

const parseCsv = (content: string): string[][] =>
  content
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(","));

const buildCorrectDisplayAnswer = (
  instance: GeneratedExamInstancePayload,
  questionPosition: number
): string => {
  const question = instance.randomizedQuestions.find((item) => item.position === questionPosition);
  const selectedOptions =
    question?.randomizedOptions.filter((option) => option.isCorrect).map((option) => option.displayCode) ?? [];

  if (instance.alternativeIdentificationType === "LETTERS") {
    return selectedOptions.join("|");
  }

  return String(selectedOptions.reduce((total, option) => total + Number(option), 0));
};

When(
  "eu gerar {int} instâncias a partir do modelo de prova cadastrado",
  async function (this: AcceptanceWorld, quantity: number) {
    const { app } = getTestContext();

    this.response = await request(app)
      .post(`/exam-templates/${this.examTemplateId}/generate`)
      .send({ quantity });

    if (this.response.status === 201) {
      const payload = this.response.body as {
        batchId: string;
        instances: GeneratedExamInstancePayload[];
        artifacts: GeneratedArtifactPayload[];
      };

      this.batchId = payload.batchId;
      this.generatedInstances = payload.instances;
      this.generatedArtifacts = payload.artifacts;
      this.answerKeyArtifactPath = payload.artifacts.find((artifact) => artifact.kind === "CSV")
        ?.absolutePath;
    }
  }
);

Then(
  "o lote retornado deve conter {int} instâncias",
  function (this: AcceptanceWorld, expectedCount: number) {
    if (this.generatedInstances.length !== expectedCount) {
      throw new Error(
        `Quantidade inesperada de instâncias. Esperado: ${expectedCount}. Recebido: ${this.generatedInstances.length}.`
      );
    }
  }
);

Then("as instâncias geradas devem ter assinaturas únicas", function (this: AcceptanceWorld) {
  const signatures = this.generatedInstances.map((instance) => String(instance.signature));
  const uniqueSignatures = new Set(signatures);

  if (uniqueSignatures.size !== signatures.length) {
    throw new Error("As assinaturas das instâncias geradas não são únicas.");
  }
});

Then(
  "ao menos duas instâncias devem ter ordem diferente de questões ou alternativas",
  function (this: AcceptanceWorld) {
    const serializedOrders = this.generatedInstances.map((instance) =>
      JSON.stringify(
        (instance as GeneratedExamInstancePayload).randomizedQuestions.map((question) => ({
          questionId: question.originalQuestionId,
          optionIds: question.randomizedOptions.map((option) => option.originalOptionId)
        }))
      )
    );

    if (new Set(serializedOrders).size === 1) {
      throw new Error("As instâncias geradas possuem a mesma ordem estrutural.");
    }
  }
);

Then("um arquivo de gabarito CSV deve ter sido gerado", async function (this: AcceptanceWorld) {
  if (!this.answerKeyArtifactPath) {
    throw new Error("Nenhum artefato CSV de gabarito foi retornado.");
  }

  await fs.access(this.answerKeyArtifactPath);
});

Then(
  "o gabarito CSV deve corresponder às respostas corretas das instâncias geradas",
  async function (this: AcceptanceWorld) {
    if (!this.answerKeyArtifactPath) {
      throw new Error("Nenhum caminho de gabarito CSV foi registrado.");
    }

    const csvContent = await fs.readFile(this.answerKeyArtifactPath, "utf-8");
    const [header, ...rows] = parseCsv(csvContent);

    const expectedQuestionCount =
      (this.generatedInstances[0] as GeneratedExamInstancePayload | undefined)?.randomizedQuestions
        .length ?? 0;
    const expectedHeader = [
      "examCode",
      ...Array.from({ length: expectedQuestionCount }, (_, index) => `q${index + 1}`)
    ];

    if (header.join(",") !== expectedHeader.join(",")) {
      throw new Error(`Cabeçalho inesperado no CSV: ${header.join(",")}`);
    }

    if (rows.length !== this.generatedInstances.length) {
      throw new Error(
        `Quantidade inesperada de linhas no gabarito. Esperado: ${this.generatedInstances.length}. Recebido: ${rows.length}.`
      );
    }

    for (const row of rows) {
      const [examCode, ...answers] = row;

      const instance = this.generatedInstances.find(
        (generatedInstance) => String(generatedInstance.examCode) === examCode
      ) as GeneratedExamInstancePayload | undefined;

      if (!instance) {
        throw new Error(`Instância não encontrada para o examCode ${examCode}.`);
      }

      if (answers.length !== instance.randomizedQuestions.length) {
        throw new Error(`Quantidade de respostas inválida no gabarito para a prova ${examCode}.`);
      }

      for (const question of instance.randomizedQuestions) {
        const answer = answers[question.position - 1] ?? "";
        if (answer !== buildCorrectDisplayAnswer(instance, question.position)) {
          throw new Error(`Resposta correta inválida no gabarito para ${examCode}, q${question.position}.`);
        }
      }
    }
  }
);
