import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import fs from "node:fs/promises";

import request from "supertest";

import {
  BackendTestHarness,
  buildStudentResponsesCsvFromAnswerKey,
  createBackendTestHarness,
  createQuestionPayload
} from "../route-support/backend-harness";

describe("Backend route contracts", () => {
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
      .send({
        title: "Prova Base",
        questionIds: [firstQuestionResponse.body.id, secondQuestionResponse.body.id],
        alternativeIdentificationType: "LETTERS"
      });

    assert.equal(createTemplateResponse.status, 201);
    const examTemplateId = createTemplateResponse.body.id as string;

    const listTemplatesResponse = await request(harness.app).get("/exam-templates");
    assert.equal(listTemplatesResponse.status, 200);
    assert.equal(listTemplatesResponse.body.length, 1);

    const getTemplateResponse = await request(harness.app).get(`/exam-templates/${examTemplateId}`);
    assert.equal(getTemplateResponse.status, 200);
    assert.equal(getTemplateResponse.body.title, "Prova Base");
    assert.equal(getTemplateResponse.body.questionsSnapshot[0].topic, "Tema T1");
    assert.equal(getTemplateResponse.body.questionsSnapshot[0].unit, 1);

    const updatedTemplateResponse = await request(harness.app)
      .put(`/exam-templates/${examTemplateId}`)
      .send({
        title: "Prova Atualizada",
        questionIds: [secondQuestionResponse.body.id, firstQuestionResponse.body.id],
        alternativeIdentificationType: "POWERS_OF_2"
      });

    assert.equal(updatedTemplateResponse.status, 200);
    assert.equal(updatedTemplateResponse.body.title, "Prova Atualizada");
    assert.equal(updatedTemplateResponse.body.alternativeIdentificationType, "POWERS_OF_2");

    const generateResponse = await request(harness.app)
      .post(`/exam-templates/${examTemplateId}/generate`)
      .send({ quantity: 2 });

    assert.equal(generateResponse.status, 201);
    assert.equal(generateResponse.body.quantity, 2);
    assert.equal(generateResponse.body.instances.length, 2);
    assert.equal(generateResponse.body.artifacts.length, 3);
  });

  it("supports grading, metrics, insights and exam template deletion cascade", async () => {
    const questionResponse = await request(harness.app)
      .post("/questions")
      .send(createQuestionPayload("Cascade"));
    const examTemplateResponse = await request(harness.app)
      .post("/exam-templates")
      .send({
        title: "Prova Cascade",
        questionIds: [questionResponse.body.id],
        alternativeIdentificationType: "LETTERS"
      });

    const examTemplateId = examTemplateResponse.body.id as string;
    const generationResponse = await request(harness.app)
      .post(`/exam-templates/${examTemplateId}/generate`)
      .send({ quantity: 1 });

    assert.equal(generationResponse.status, 201);
    const answerKeyArtifact = generationResponse.body.artifacts.find(
      (artifact: { kind: string }) => artifact.kind === "CSV"
    ) as { absolutePath: string } | undefined;
    assert.ok(answerKeyArtifact);

    const answerKeyBuffer = await fs.readFile(answerKeyArtifact.absolutePath);
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
});
