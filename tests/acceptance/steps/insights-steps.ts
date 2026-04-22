import { Given, Then, When } from "@cucumber/cucumber";
import request from "supertest";

import { DashboardMetricsResponse } from "../../../backend/src/application/dto/dashboard-metrics-response";
import { FakeLLMProviderService } from "../support/fake-llm-provider";
import { getTestContext } from "../support/test-context";
import { AcceptanceWorld } from "../support/world";
import { binaryParser } from "../../support/http-binary";

interface GeneratedExamInstancePayload {
  examCode: string;
  alternativeIdentificationType: string;
  randomizedQuestions: Array<{
    originalQuestionId: string;
    position: number;
    randomizedOptions: Array<{
      originalOptionId: string;
      description: string;
      displayCode: string;
      isCorrect: boolean;
    }>;
  }>;
}

type AnswerMode = "correct" | "firstIncorrect";

const buildAnswerForQuestion = (
  instance: GeneratedExamInstancePayload,
  originalQuestionId: string,
  answerMode: AnswerMode
): { questionPosition: number; markedAnswer: string } => {
  const question = instance.randomizedQuestions.find(
    (item) => item.originalQuestionId === originalQuestionId
  );

  if (!question) {
    throw new Error(`Questão ${originalQuestionId} não encontrada na instância.`);
  }

  const selectedOptions =
    answerMode === "correct"
      ? question.randomizedOptions.filter((option) => option.isCorrect)
      : question.randomizedOptions.filter((option) => !option.isCorrect).slice(0, 1);

  const markedAnswer =
    instance.alternativeIdentificationType === "LETTERS"
      ? selectedOptions.map((option) => option.displayCode).join("|")
      : String(
          selectedOptions.reduce((total, option) => total + Number(option.displayCode), 0)
        );

  return {
    questionPosition: question.position,
    markedAnswer
  };
};

const buildStudentRows = (
  studentId: string,
  studentName: string,
  instance: GeneratedExamInstancePayload,
  answerPlan: Record<string, AnswerMode>
): string => {
  const answers = [...instance.randomizedQuestions]
    .sort((left, right) => left.position - right.position)
    .map((question) => {
      const answerMode = answerPlan[question.originalQuestionId];
      if (!answerMode) {
        return "";
      }

      return buildAnswerForQuestion(instance, question.originalQuestionId, answerMode).markedAnswer;
    });

  return `${studentId},${studentName},${instance.examCode},${answers.join(",")}`;
};

const getInsightsPayload = (world: AcceptanceWorld): {
  metrics: DashboardMetricsResponse;
  insights: string | null;
  warning?: string;
} => world.response?.body as { metrics: DashboardMetricsResponse; insights: string | null; warning?: string };

Given(
  "que existe um relatório de prova corrigida com duas questões e dois alunos",
  async function (this: AcceptanceWorld) {
    const { app } = getTestContext();

    const questionPayloads = [
      {
        topic: "Aritmética",
        unit: 1,
        statement: "Quanto é 1 + 1?",
        options: [
          { description: "2", isCorrect: true },
          { description: "3", isCorrect: false }
        ]
      },
      {
        topic: "Natureza",
        unit: 2,
        statement: "Qual cor do céu sem nuvens?",
        options: [
          { description: "Verde", isCorrect: false },
          { description: "Azul", isCorrect: true }
        ]
      }
    ];

    for (const questionPayload of questionPayloads) {
      const response = await request(app).post("/questions").send(questionPayload);
      this.questionIds.push(response.body.id as string);
    }

    const examTemplateResponse = await request(app).post("/exam-templates").send({
      title: "Prova da Turma A",
      questionIds: this.questionIds,
      alternativeIdentificationType: "LETTERS",
      headerMetadata: {
        discipline: "Ciências",
        teacher: "Profa. Katherine Johnson",
        examDate: "2026-04-10"
      }
    });

    this.examTemplateId = examTemplateResponse.body.id as string;

    const generationResponse = await request(app)
      .post(`/exam-templates/${this.examTemplateId}/generate`)
      .send({ quantity: 2 });

    this.batchId = generationResponse.body.batchId as string;
    this.generatedInstances = generationResponse.body.instances as Array<Record<string, unknown>>;
    this.generatedArtifacts = generationResponse.body.artifacts as Array<Record<string, unknown>>;
    const answerKeyArtifact = (
      generationResponse.body.artifacts as Array<{
        id: string;
        kind: string;
        absolutePath: string | null;
        downloadUrl: string;
      }>
    ).find((artifact) => artifact.kind === "CSV");
    this.answerKeyArtifactPath = answerKeyArtifact?.absolutePath ?? undefined;
    this.answerKeyArtifactId = answerKeyArtifact?.id;
    this.answerKeyDownloadUrl = answerKeyArtifact?.downloadUrl;

    if (!this.answerKeyArtifactId) {
      throw new Error("O gabarito CSV não foi gerado.");
    }

    const answerKeyResponse = await request(app)
      .get(`/exam-batches/artifacts/${this.answerKeyArtifactId}/download`)
      .buffer(true)
      .parse(binaryParser);
    if (answerKeyResponse.status !== 200) {
      throw new Error(
        `Não foi possível baixar o gabarito CSV. Status recebido: ${answerKeyResponse.status}.`
      );
    }

    const answerKeyBuffer = answerKeyResponse.body as Buffer;
    const [firstInstance, secondInstance] = this.generatedInstances as GeneratedExamInstancePayload[];

    const questionHeaders = [...firstInstance.randomizedQuestions]
      .sort((left, right) => left.position - right.position)
      .map((question) => `q${question.position}`);
    const studentRows = [
      ["studentId", "studentName", "examCode", ...questionHeaders].join(","),
      buildStudentRows("ALUNO-1", "Ana", firstInstance, {
        [this.questionIds[0]!]: "correct",
        [this.questionIds[1]!]: "correct"
      }),
      buildStudentRows("ALUNO-2", "Bruno", secondInstance, {
        [this.questionIds[0]!]: "firstIncorrect",
        [this.questionIds[1]!]: "correct"
      })
    ];

    this.response = await request(app)
      .post("/exams/grade")
      .field("gradingStrategyType", "STRICT")
      .attach("answerKeyFile", answerKeyBuffer, {
        filename: "answer-key.csv",
        contentType: "text/csv"
      })
      .attach("studentResponsesFile", Buffer.from(studentRows.join("\n"), "utf-8"), {
        filename: "student-responses.csv",
        contentType: "text/csv"
      });

    this.examId = this.response.body.examId as string | undefined;
    if (!this.examId) {
      throw new Error("O endpoint de correção não retornou examId.");
    }
  }
);

Given(
  "que o provider de IA está indisponível por timeout",
  function () {
    const { llmProviderService } = getTestContext();
    (llmProviderService as FakeLLMProviderService).mode = "timeout";
  }
);

When(
  "eu consultar os insights educacionais dessa prova",
  async function (this: AcceptanceWorld) {
    const { app } = getTestContext();

    this.response = await request(app).get(`/exams/${this.examId}/insights`);
  }
);

Then(
  "as métricas do dashboard devem indicar {int} alunos e média {float}",
  function (this: AcceptanceWorld, expectedStudents: number, expectedAverageScore: number) {
    const payload = getInsightsPayload(this);

    if (payload.metrics.summary.totalStudents !== expectedStudents) {
      throw new Error(
        `Total de alunos inesperado. Esperado: ${expectedStudents}. Recebido: ${payload.metrics.summary.totalStudents}.`
      );
    }

    if (Math.abs(payload.metrics.summary.averageScore - expectedAverageScore) > 0.0001) {
      throw new Error(
        `Média geral inesperada. Esperado: ${expectedAverageScore}. Recebido: ${payload.metrics.summary.averageScore}.`
      );
    }
  }
);

Then(
  "as métricas do dashboard devem indicar percentual médio {int}",
  function (this: AcceptanceWorld, expectedAveragePercentage: number) {
    const payload = getInsightsPayload(this);

    if (Math.abs(payload.metrics.summary.averagePercentage - expectedAveragePercentage) > 0.0001) {
      throw new Error(
        `Percentual médio inesperado. Esperado: ${expectedAveragePercentage}. Recebido: ${payload.metrics.summary.averagePercentage}.`
      );
    }
  }
);

Then(
  "a linha da questão {int} deve indicar média {float} e taxa de acerto completo {int}",
  function (
    this: AcceptanceWorld,
    questionOrder: number,
    expectedAverageScore: number,
    expectedFullCorrectRate: number
  ) {
    const payload = getInsightsPayload(this);
    const line = payload.metrics.lineChartData.find((item) => item.order === questionOrder);

    if (!line) {
      throw new Error(`Linha não encontrada para a questão ${questionOrder}.`);
    }

    if (Math.abs(line.averageScore - expectedAverageScore) > 0.0001) {
      throw new Error(
        `Average score inesperado para a questão ${questionOrder}. Esperado: ${expectedAverageScore}. Recebido: ${line.averageScore}.`
      );
    }

    if (Math.abs(line.fullCorrectRate - expectedFullCorrectRate) > 0.0001) {
      throw new Error(
        `Full correct rate inesperado para a questão ${questionOrder}. Esperado: ${expectedFullCorrectRate}. Recebido: ${line.fullCorrectRate}.`
      );
    }
  }
);

Then(
  "a barra da questão {int} deve indicar taxa de acerto {int} e média percentual {int}",
  function (
    this: AcceptanceWorld,
    questionOrder: number,
    expectedAccuracyRate: number,
    expectedAverageScoreRate: number
  ) {
    const payload = getInsightsPayload(this);
    const bar = payload.metrics.barChartData.find((item) => item.order === questionOrder);

    if (!bar) {
      throw new Error(`Barra não encontrada para a questão ${questionOrder}.`);
    }

    if (Math.abs(bar.accuracyRate - expectedAccuracyRate) > 0.0001) {
      throw new Error(
        `Taxa de acerto inesperada para a questão ${questionOrder}. Esperado: ${expectedAccuracyRate}. Recebido: ${bar.accuracyRate}.`
      );
    }

    if (Math.abs(bar.averageScoreRate - expectedAverageScoreRate) > 0.0001) {
      throw new Error(
        `Média percentual inesperada para a questão ${questionOrder}. Esperado: ${expectedAverageScoreRate}. Recebido: ${bar.averageScoreRate}.`
      );
    }
  }
);

Then(
  "o donut da questão {int} deve indicar {int} marcação na alternativa {string} e {int} marcação na alternativa {string}",
  function (
    this: AcceptanceWorld,
    questionOrder: number,
    expectedFirstValue: number,
    firstOptionDescription: string,
    expectedSecondValue: number,
    secondOptionDescription: string
  ) {
    const payload = getInsightsPayload(this);
    const donutGroup = payload.metrics.donutChartsByQuestion.find(
      (item) => item.order === questionOrder
    );

    if (!donutGroup) {
      throw new Error(`Donut não encontrado para a questão ${questionOrder}.`);
    }

    const firstOption = donutGroup.data.find(
      (item) => item.description === firstOptionDescription
    );
    const secondOption = donutGroup.data.find(
      (item) => item.description === secondOptionDescription
    );

    if (!firstOption || !secondOption) {
      throw new Error(`Alternativas esperadas não encontradas no donut da questão ${questionOrder}.`);
    }

    if (firstOption.value !== expectedFirstValue || secondOption.value !== expectedSecondValue) {
      throw new Error(
        `Contagens inesperadas no donut. Esperado: ${expectedFirstValue}/${expectedSecondValue}. Recebido: ${firstOption.value}/${secondOption.value}.`
      );
    }
  }
);

Then(
  "o provider de IA deve ter recebido métricas agregadas sem dados pessoais",
  function () {
    const { llmProviderService } = getTestContext();
    const provider = llmProviderService as FakeLLMProviderService;

    if (!provider.lastMetricsData) {
      throw new Error("O provider de IA não recebeu métricas para gerar insights.");
    }

    const serializedMetrics = JSON.stringify(provider.lastMetricsData);
    if (serializedMetrics.includes("ALUNO-1") || serializedMetrics.includes("Ana")) {
      throw new Error("O payload enviado ao provider contém dados pessoais dos alunos.");
    }

    if ("students" in provider.lastMetricsData) {
      throw new Error("O payload enviado ao provider não deveria expor o relatório detalhado por aluno.");
    }
  }
);

Then(
  "o texto de insights deve ser retornado",
  function (this: AcceptanceWorld) {
    const payload = getInsightsPayload(this);

    if (!payload.insights || payload.insights.length === 0) {
      throw new Error("Nenhum insight foi retornado pelo endpoint.");
    }
  }
);

Then(
  "o aviso de insights indisponíveis deve ser retornado",
  function (this: AcceptanceWorld) {
    const payload = getInsightsPayload(this);

    if (payload.warning !== "Insights indisponíveis no momento.") {
      throw new Error(
        `Aviso inesperado. Esperado: Insights indisponíveis no momento.. Recebido: ${payload.warning}.`
      );
    }
  }
);

Then(
  "o campo de insights deve vir nulo",
  function (this: AcceptanceWorld) {
    const payload = getInsightsPayload(this);

    if (payload.insights !== null) {
      throw new Error("O campo insights deveria ser nulo quando o provider está indisponível.");
    }
  }
);
