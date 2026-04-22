import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import request from "supertest";

import {
  BackendTestHarness,
  createBackendTestHarness
} from "../route-support/backend-harness";

describe("Pedagogical module routes (alunos/metas/turmas/avaliações/e-mail)", () => {
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

  const createStudent = async (overrides?: Partial<{ name: string; cpf: string; email: string }>) => {
    const response = await request(harness.app).post("/students").send({
      name: overrides?.name ?? "Ana Souza",
      cpf: overrides?.cpf ?? "52998224725",
      email: overrides?.email ?? "ana@example.com"
    });
    assert.equal(response.status, 201);
    return response.body as { id: string; name: string; email: string };
  };

  const createGoal = async (name: string) => {
    const response = await request(harness.app).post("/goals").send({ name });
    assert.equal(response.status, 201);
    return response.body as { id: string; name: string };
  };

  const createClass = async (studentIds: string[], goalIds: string[]) => {
    const response = await request(harness.app).post("/classes").send({
      topic: "Alfabetização",
      year: 2026,
      semester: 1,
      studentIds,
      goalIds
    });
    assert.equal(response.status, 201);
    return response.body as { id: string; studentIds: string[]; goalIds: string[] };
  };

  it("student CRUD validates CPF and email", async () => {
    const badCpf = await request(harness.app).post("/students").send({
      name: "Fulano",
      cpf: "00000000000",
      email: "fulano@example.com"
    });
    assert.equal(badCpf.status, 400);

    const badEmail = await request(harness.app).post("/students").send({
      name: "Fulano",
      cpf: "52998224725",
      email: "nao-eh-email"
    });
    assert.equal(badEmail.status, 400);

    const created = await createStudent();
    const list = await request(harness.app).get("/students");
    assert.equal(list.status, 200);
    assert.equal(list.body.length, 1);

    const get = await request(harness.app).get(`/students/${created.id}`);
    assert.equal(get.status, 200);
    assert.equal(get.body.name, "Ana Souza");

    const update = await request(harness.app).put(`/students/${created.id}`).send({
      name: "Ana Souza",
      cpf: "52998224725",
      email: "ana.updated@example.com"
    });
    assert.equal(update.status, 200);
    assert.equal(update.body.email, "ana.updated@example.com");

    const remove = await request(harness.app).delete(`/students/${created.id}`);
    assert.equal(remove.status, 204);

    const missing = await request(harness.app).get(`/students/${created.id}`);
    assert.equal(missing.status, 404);
  });

  it("goal CRUD enforces required name", async () => {
    const invalid = await request(harness.app).post("/goals").send({ name: "" });
    assert.equal(invalid.status, 400);

    const goal = await createGoal("Leitura fluente");
    const list = await request(harness.app).get("/goals");
    assert.equal(list.status, 200);
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].name, "Leitura fluente");

    const update = await request(harness.app)
      .put(`/goals/${goal.id}`)
      .send({ name: "Leitura fluente avançada", description: "Ler e interpretar" });
    assert.equal(update.status, 200);
    assert.equal(update.body.description, "Ler e interpretar");

    const remove = await request(harness.app).delete(`/goals/${goal.id}`);
    assert.equal(remove.status, 204);
  });

  it("class CRUD links students and goals and cascades deletions", async () => {
    const student = await createStudent();
    const goalA = await createGoal("Leitura");
    const goalB = await createGoal("Escrita");
    const classGroup = await createClass([student.id], [goalA.id, goalB.id]);

    const update = await request(harness.app)
      .put(`/classes/${classGroup.id}`)
      .send({
        topic: "Alfabetização",
        year: 2026,
        semester: 1,
        studentIds: [student.id],
        goalIds: [goalA.id]
      });
    assert.equal(update.status, 200);
    assert.equal(update.body.goalIds.length, 1);

    // Removing a student cascades to evaluations + classes
    const evalResponse = await request(harness.app)
      .put(`/classes/${classGroup.id}/evaluations`)
      .send({ studentId: student.id, goalId: goalA.id, level: "MA" });
    assert.equal(evalResponse.status, 200);

    const removeStudent = await request(harness.app).delete(`/students/${student.id}`);
    assert.equal(removeStudent.status, 204);

    const listEvaluations = await request(harness.app).get(
      `/classes/${classGroup.id}/evaluations`
    );
    assert.equal(listEvaluations.status, 200);
    assert.equal(listEvaluations.body.evaluations.length, 0);
  });

  it("evaluation endpoint validates student/goal membership and level enum", async () => {
    const student = await createStudent();
    const goal = await createGoal("Leitura");
    const classGroup = await createClass([student.id], [goal.id]);

    const invalidLevel = await request(harness.app)
      .put(`/classes/${classGroup.id}/evaluations`)
      .send({ studentId: student.id, goalId: goal.id, level: "XYZ" });
    assert.equal(invalidLevel.status, 400);

    const unknownGoal = await request(harness.app)
      .put(`/classes/${classGroup.id}/evaluations`)
      .send({ studentId: student.id, goalId: "not-in-class", level: "MA" });
    assert.ok(unknownGoal.status === 400 || unknownGoal.status === 404);

    const ok = await request(harness.app)
      .put(`/classes/${classGroup.id}/evaluations`)
      .send({ studentId: student.id, goalId: goal.id, level: "MPA" });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.level, "MPA");

    const upsert = await request(harness.app)
      .put(`/classes/${classGroup.id}/evaluations`)
      .send({ studentId: student.id, goalId: goal.id, level: "MA" });
    assert.equal(upsert.status, 200);
    assert.equal(upsert.body.level, "MA");

    const listing = await request(harness.app).get(`/classes/${classGroup.id}/evaluations`);
    assert.equal(listing.status, 200);
    assert.equal(listing.body.evaluations.length, 1);
    assert.equal(listing.body.evaluations[0].level, "MA");
  });

  it("processes the daily digest and sends a single email per student", async () => {
    const student = await createStudent();
    const goalA = await createGoal("Leitura");
    const goalB = await createGoal("Escrita");
    const classGroup = await createClass([student.id], [goalA.id, goalB.id]);

    await request(harness.app)
      .put(`/classes/${classGroup.id}/evaluations`)
      .send({ studentId: student.id, goalId: goalA.id, level: "MPA" });
    await request(harness.app)
      .put(`/classes/${classGroup.id}/evaluations`)
      .send({ studentId: student.id, goalId: goalB.id, level: "MA" });

    const digest = await request(harness.app).post("/email/digest").send({});
    assert.equal(digest.status, 200);
    assert.equal(digest.body.emailsSent, 1);
    assert.equal(digest.body.entriesProcessed, 2);

    const sent = harness.emailService.getSent();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, "ana@example.com");
    assert.ok(sent[0].subject.toLowerCase().includes("resumo"));
    assert.ok(sent[0].text.includes("Leitura"));
    assert.ok(sent[0].text.includes("Escrita"));

    // Running the digest a second time must not re-send.
    const rerun = await request(harness.app).post("/email/digest").send({});
    assert.equal(rerun.status, 200);
    assert.equal(rerun.body.emailsSent, 0);
    assert.equal(harness.emailService.getSent().length, 1);
  });
});
