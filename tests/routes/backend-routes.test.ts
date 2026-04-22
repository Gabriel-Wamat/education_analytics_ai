import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import crypto from "node:crypto";

import request from "supertest";

import {
  BackendTestHarness,
  buildStudentResponsesCsvFromAnswerKey,
  createExamTemplatePayload,
  createBackendTestHarness,
  createQuestionPayload
} from "../route-support/backend-harness";
import { binaryParser } from "../support/http-binary";

const extractPdfText = (pdfContent: string): string =>
  [...pdfContent.matchAll(/<([0-9A-Fa-f]+)>/g)]
    .map((match) => Buffer.from(match[1] ?? "", "hex").toString("latin1"))
    .join("");

describe("Backend route contracts", { concurrency: 1 }, () => {
  let harness: BackendTestHarness;

  before(async () => {
    harness = await createBackendTestHarness();
  });

  beforeEach(async () => {
    await harness.reset();
  });

  after(async () => {
    await harness.close();
  });

  it("exposes health and local CORS preflight", async () => {
    const healthResponse = await request(harness.app).get("/health");
    assert.equal(healthResponse.status, 200);
    assert.deepEqual(healthResponse.body, { status: "ok" });

    const preflightResponse = await request(harness.app)
      .options("/questions")
      .set("Origin", "http://127.0.0.1:5173")
      .set("Access-Control-Request-Method", "GET");

    assert.equal(preflightResponse.status, 204);
    assert.equal(
      preflightResponse.headers["access-control-allow-origin"],
      "http://127.0.0.1:5173"
    );
  });

  it("supports question CRUD routes", async () => {
    const initialListResponse = await request(harness.app).get("/questions");
    assert.equal(initialListResponse.status, 200);
    assert.deepEqual(initialListResponse.body, []);

    const createResponse = await request(harness.app)
      .post("/questions")
      .send(createQuestionPayload("Rota"));
    assert.equal(createResponse.status, 201);
    assert.ok(createResponse.body.id);

    const questionId = createResponse.body.id as string;

    const getResponse = await request(harness.app).get(`/questions/${questionId}`);
    assert.equal(getResponse.status, 200);
    assert.equal(getResponse.body.statement, "Questão Rota");
    assert.equal(getResponse.body.topic, "Tema Rota");
    assert.equal(getResponse.body.unit, 1);

    const updateResponse = await request(harness.app)
      .put(`/questions/${questionId}`)
      .send({
        topic: "Álgebra",
        unit: 2,
        statement: "Questão Atualizada",
        options: [
          { description: "Alternativa 1", isCorrect: false },
          { description: "Alternativa 2", isCorrect: true }
        ]
      });
    assert.equal(updateResponse.status, 200);
    assert.equal(updateResponse.body.statement, "Questão Atualizada");
    assert.equal(updateResponse.body.topic, "Álgebra");
    assert.equal(updateResponse.body.unit, 2);
    assert.equal(updateResponse.body.options.length, 2);

    const deleteResponse = await request(harness.app).delete(`/questions/${questionId}`);
    assert.equal(deleteResponse.status, 204);

    const finalListResponse = await request(harness.app).get("/questions");
    assert.equal(finalListResponse.status, 200);
    assert.deepEqual(finalListResponse.body, []);
  });

  it("supports exam template CRUD routes and generation", async () => {
    const firstQuestionResponse = await request(harness.app)
      .post("/questions")
      .send(createQuestionPayload("T1"));
    const secondQuestionResponse = await request(harness.app)
      .post("/questions")
      .send(createQuestionPayload("T2"));

    const createTemplateResponse = await request(harness.app)
      .post("/exam-templates")
      .send(
        createExamTemplatePayload([firstQuestionResponse.body.id, secondQuestionResponse.body.id], {
          title: "Prova Base",
          alternativeIdentificationType: "LETTERS",
          discipline: "Matemática",
          teacher: "Prof. Ada Lovelace",
          examDate: "2026-04-10"
        })
      );

    assert.equal(createTemplateResponse.status, 201);
    const examTemplateId = createTemplateResponse.body.id as string;
    assert.deepEqual(createTemplateResponse.body.headerMetadata, {
      discipline: "Matemática",
      teacher: "Prof. Ada Lovelace",
      examDate: "2026-04-10"
    });

    const listTemplatesResponse = await request(harness.app).get("/exam-templates");
    assert.equal(listTemplatesResponse.status, 200);
    assert.equal(listTemplatesResponse.body.length, 1);

    const getTemplateResponse = await request(harness.app).get(`/exam-templates/${examTemplateId}`);
    assert.equal(getTemplateResponse.status, 200);
    assert.equal(getTemplateResponse.body.title, "Prova Base");
    assert.equal(getTemplateResponse.body.questionsSnapshot[0].topic, "Tema T1");
    assert.equal(getTemplateResponse.body.questionsSnapshot[0].unit, 1);
    assert.equal(getTemplateResponse.body.headerMetadata.discipline, "Matemática");

    const updatedTemplateResponse = await request(harness.app)
      .put(`/exam-templates/${examTemplateId}`)
      .send(
        createExamTemplatePayload([secondQuestionResponse.body.id, firstQuestionResponse.body.id], {
          title: "Prova Atualizada",
          alternativeIdentificationType: "POWERS_OF_2",
          discipline: "Física",
          teacher: "Profa. Grace Hopper",
          examDate: "2026-05-20"
        })
      );

    assert.equal(updatedTemplateResponse.status, 200);
    assert.equal(updatedTemplateResponse.body.title, "Prova Atualizada");
    assert.equal(updatedTemplateResponse.body.alternativeIdentificationType, "POWERS_OF_2");
    assert.equal(updatedTemplateResponse.body.headerMetadata.teacher, "Profa. Grace Hopper");

    const generateResponse = await request(harness.app)
      .post(`/exam-templates/${examTemplateId}/generate`)
      .send({ quantity: 2 });

    assert.equal(generateResponse.status, 201);
    assert.equal(generateResponse.body.quantity, 2);
    assert.equal(generateResponse.body.instances.length, 2);
    assert.equal(generateResponse.body.artifacts.length, 3);

    const answerKeyArtifact = generateResponse.body.artifacts.find(
      (artifact: { kind: string }) => artifact.kind === "CSV"
    ) as { id: string; downloadUrl: string } | undefined;
    assert.ok(answerKeyArtifact);

    const batchesResponse = await request(harness.app).get(
      `/exam-templates/${examTemplateId}/batches`
    );
    assert.equal(batchesResponse.status, 200);
    assert.equal(batchesResponse.body.length, 1);

    const batchDetailResponse = await request(harness.app).get(
      `/exam-batches/${generateResponse.body.batchId as string}`
    );
    assert.equal(batchDetailResponse.status, 200);
    assert.equal(batchDetailResponse.body.instances.length, 2);

    const answerKeyDownloadResponse = await request(harness.app)
      .get(`/exam-batches/artifacts/${answerKeyArtifact.id}/download`)
      .buffer(true)
      .parse(binaryParser);
    assert.equal(answerKeyDownloadResponse.status, 200);
    assert.match(answerKeyDownloadResponse.headers["content-type"], /text\/csv/);

    const answerKeyContent = (answerKeyDownloadResponse.body as Buffer).toString("utf-8");
    const answerKeyRows = answerKeyContent.trim().split(/\r?\n/);
    assert.equal(answerKeyRows.length, 3);
    assert.match(answerKeyRows[0] ?? "", /^examCode,q1,q2$/);
  });

  it("supports grading, metrics, insights and exam template deletion cascade", async () => {
    const questionResponse = await request(harness.app)
      .post("/questions")
      .send(createQuestionPayload("Cascade"));
    const examTemplateResponse = await request(harness.app)
      .post("/exam-templates")
      .send(
        createExamTemplatePayload([questionResponse.body.id], {
          title: "Prova Cascade",
          alternativeIdentificationType: "LETTERS"
        })
      );

    const examTemplateId = examTemplateResponse.body.id as string;
    const generationResponse = await request(harness.app)
      .post(`/exam-templates/${examTemplateId}/generate`)
      .send({ quantity: 1 });

    assert.equal(generationResponse.status, 201);
    const answerKeyArtifact = generationResponse.body.artifacts.find(
      (artifact: { kind: string }) => artifact.kind === "CSV"
    ) as { id: string } | undefined;
    assert.ok(answerKeyArtifact);

    const answerKeyDownloadResponse = await request(harness.app)
      .get(`/exam-batches/artifacts/${answerKeyArtifact.id}/download`)
      .buffer(true)
      .parse(binaryParser);
    assert.equal(answerKeyDownloadResponse.status, 200);

    const answerKeyBuffer = answerKeyDownloadResponse.body as Buffer;
    const studentResponsesCsv = buildStudentResponsesCsvFromAnswerKey(
      answerKeyBuffer.toString("utf-8")
    );

    const gradeResponse = await request(harness.app)
      .post("/exams/grade")
      .field("gradingStrategyType", "STRICT")
      .attach("answerKeyFile", answerKeyBuffer, {
        filename: "answer-key.csv",
        contentType: "text/csv"
      })
      .attach("studentResponsesFile", Buffer.from(studentResponsesCsv, "utf-8"), {
        filename: "student-responses.csv",
        contentType: "text/csv"
      });

    assert.equal(gradeResponse.status, 200);
    assert.ok(gradeResponse.body.examId);
    const examId = gradeResponse.body.examId as string;

    const metricsResponse = await request(harness.app).get(`/exams/${examId}/metrics`);
    assert.equal(metricsResponse.status, 200);
    assert.equal(metricsResponse.body.examId, examId);
    assert.equal(metricsResponse.body.lineChartData[0].unit, 1);

    const insightsResponse = await request(harness.app).get(`/exams/${examId}/insights`);
    assert.equal(insightsResponse.status, 200);
    assert.equal(insightsResponse.body.examId, examId);
    assert.match(insightsResponse.body.insights, /Insights/i);

    const deleteResponse = await request(harness.app).delete(`/exam-templates/${examTemplateId}`);
    assert.equal(deleteResponse.status, 204);

    const getDeletedTemplateResponse = await request(harness.app).get(
      `/exam-templates/${examTemplateId}`
    );
    assert.equal(getDeletedTemplateResponse.status, 404);
  });

  it("blocks generation when a legacy template has no header metadata", async () => {
    const questionResponse = await request(harness.app)
      .post("/questions")
      .send(createQuestionPayload("Legacy"));

    const now = new Date();
    const examTemplate = await harness.prismaClient.examTemplate.create({
      data: {
        id: crypto.randomUUID(),
        title: "Template legado",
        headerMetadata: null,
        alternativeIdentificationType: "LETTERS",
        questionsSnapshot: [
          {
            ...questionResponse.body,
            createdAt: questionResponse.body.createdAt,
            updatedAt: questionResponse.body.updatedAt
          }
        ],
        createdAt: now,
        updatedAt: now
      }
    });

    const response = await request(harness.app)
      .post(`/exam-templates/${examTemplate.id}/generate`)
      .send({ quantity: 1 });

    assert.equal(response.status, 400);
    assert.equal(
      response.body.message,
      "O modelo de prova precisa ter disciplina, professor e data antes da geração."
    );
  });

  it("renders PDF with header metadata, footer and student identification block", async () => {
    const questionIds: string[] = [];
    for (let index = 0; index < 12; index += 1) {
      const response = await request(harness.app)
        .post("/questions")
        .send({
          topic: "Leitura",
          unit: 1,
          statement: `Questão longa ${index + 1} com enunciado descritivo para forçar quebra de página e validar o layout completo do PDF.`,
          options: [
            { description: "Alternativa A muito detalhada para ocupar mais espaço no PDF.", isCorrect: true },
            { description: "Alternativa B muito detalhada para ocupar mais espaço no PDF.", isCorrect: false },
            { description: "Alternativa C muito detalhada para ocupar mais espaço no PDF.", isCorrect: false },
            { description: "Alternativa D muito detalhada para ocupar mais espaço no PDF.", isCorrect: true }
          ]
        });
      questionIds.push(response.body.id as string);
    }

    const examTemplateResponse = await request(harness.app)
      .post("/exam-templates")
      .send(
        createExamTemplatePayload(questionIds, {
          title: "Avaliação Bimestral",
          discipline: "Matemática",
          teacher: "Prof. Alan Turing",
          examDate: "2026-06-15"
        })
      );
    assert.equal(examTemplateResponse.status, 201);

    const generationResponse = await request(harness.app)
      .post(`/exam-templates/${examTemplateResponse.body.id}/generate`)
      .send({ quantity: 1 });

    assert.equal(generationResponse.status, 201);
    const pdfArtifact = generationResponse.body.artifacts.find(
      (artifact: { kind: string }) => artifact.kind === "PDF"
    ) as { id: string } | undefined;
    assert.ok(pdfArtifact);

    const pdfDownloadResponse = await request(harness.app)
      .get(`/exam-batches/artifacts/${pdfArtifact.id}/download`)
      .buffer(true)
      .parse(binaryParser);
    assert.equal(pdfDownloadResponse.status, 200);
    assert.match(pdfDownloadResponse.headers["content-type"], /application\/pdf/);

    const pdfContent = (pdfDownloadResponse.body as Buffer).toString("latin1");
    const extractedPdfText = extractPdfText(pdfContent);
    assert.match(extractedPdfText, /Avaliação Bimestral/);
    assert.match(extractedPdfText, /Disciplina: Matemática/);
    assert.match(extractedPdfText, /Professor: Prof\. Alan Turing/);
    assert.match(extractedPdfText, /Data: 15\/06\/2026/);
    assert.match(extractedPdfText, /Nome do aluno:/);
    assert.match(extractedPdfText, /CPF:/);

    const footerMatches = extractedPdfText.match(/Prova [A-Z0-9-]+ - Pagina \d+ de \d+/g) ?? [];
    assert.ok(footerMatches.length >= 2);
  });

  it("dispatches a generated batch to a class with deterministic student-to-proof mapping", async () => {
    const firstQuestionResponse = await request(harness.app)
      .post("/questions")
      .send(createQuestionPayload("Dispatch A"));
    const secondQuestionResponse = await request(harness.app)
      .post("/questions")
      .send(createQuestionPayload("Dispatch B"));

    const templateResponse = await request(harness.app)
      .post("/exam-templates")
      .send(
        createExamTemplatePayload([firstQuestionResponse.body.id, secondQuestionResponse.body.id], {
          title: "Prova por Email",
          discipline: "Matemática",
          teacher: "Prof. Email",
          examDate: "2026-04-22"
        })
      );
    assert.equal(templateResponse.status, 201);

    const generationResponse = await request(harness.app)
      .post(`/exam-templates/${templateResponse.body.id as string}/generate`)
      .send({ quantity: 2 });
    assert.equal(generationResponse.status, 201);

    const firstStudentResponse = await request(harness.app).post("/students").send({
      name: "Aluno 1",
      cpf: "52998224725",
      email: "aluno1@example.com"
    });
    const secondStudentResponse = await request(harness.app).post("/students").send({
      name: "Aluno 2",
      cpf: "16899535009",
      email: "aluno2@example.com"
    });
    assert.equal(firstStudentResponse.status, 201);
    assert.equal(secondStudentResponse.status, 201);

    const goalResponse = await request(harness.app).post("/goals").send({ name: "Prova 1" });
    assert.equal(goalResponse.status, 201);

    const classResponse = await request(harness.app).post("/classes").send({
      topic: "Turma Email",
      year: 2026,
      semester: 1,
      studentIds: [firstStudentResponse.body.id, secondStudentResponse.body.id],
      goalIds: [goalResponse.body.id]
    });
    assert.equal(classResponse.status, 201);

    const dispatchResponse = await request(harness.app)
      .post(`/exam-batches/${generationResponse.body.batchId as string}/email-dispatch`)
      .send({ classId: classResponse.body.id });

    assert.equal(dispatchResponse.status, 200);
    assert.equal(dispatchResponse.body.emailsSent, 2);
    assert.equal(dispatchResponse.body.assignments.length, 2);

    const assignments = dispatchResponse.body.assignments as Array<{
      studentEmail: string;
      examCode: string;
      downloadUrl: string;
      sent: boolean;
    }>;

    assert.equal(assignments[0]?.studentEmail, "aluno1@example.com");
    assert.equal(assignments[1]?.studentEmail, "aluno2@example.com");
    assert.ok(assignments[0]?.examCode.localeCompare(assignments[1]?.examCode) < 0);
    assert.ok(assignments.every((assignment) => assignment.sent === true));
    assert.ok(
      assignments.every((assignment) =>
        assignment.downloadUrl.includes("/api/exam-batches/artifacts/pdf--")
      )
    );

    const sentMessages = harness.emailService.getSent();
    assert.equal(sentMessages.length, 2);
    assert.ok(sentMessages.every((message) => message.subject.includes("Prova disponível")));

    const emailHistoryResponse = await request(harness.app).get("/email/messages");
    assert.equal(emailHistoryResponse.status, 200);
    assert.equal(emailHistoryResponse.body.length, 2);
    assert.ok(
      emailHistoryResponse.body.every((entry: { subject: string }) =>
        entry.subject.includes("Prova disponível")
      )
    );
  });
});
