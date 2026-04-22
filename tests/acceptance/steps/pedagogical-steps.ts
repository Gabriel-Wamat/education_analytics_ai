import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import request from "supertest";

import { getTestContext } from "../support/test-context";
import { AcceptanceWorld } from "../support/world";

const assertLastStatus = (world: AcceptanceWorld, status: number) => {
  assert.ok(world.response, "Nenhuma resposta HTTP capturada.");
  assert.equal(world.response!.status, status, `Esperava ${status}, recebi ${world.response!.status}. Corpo: ${JSON.stringify(world.response!.body)}`);
};

const ensureStudent = async (
  world: AcceptanceWorld,
  name: string,
  cpf: string,
  email: string
): Promise<void> => {
  const { app } = getTestContext();
  const response = await request(app)
    .post("/students")
    .send({ name, cpf, email });
  world.response = response;
  if (response.status === 201) {
    world.studentsByName.set(name, {
      id: response.body.id as string,
      email,
      name
    });
    world.lastStudentId = response.body.id as string;
  }
};

const ensureGoal = async (world: AcceptanceWorld, name: string): Promise<void> => {
  const { app } = getTestContext();
  const response = await request(app).post("/goals").send({ name });
  world.response = response;
  if (response.status === 201) {
    world.goalsByName.set(name, { id: response.body.id as string, name });
    world.lastGoalId = response.body.id as string;
  }
};

const parseNameList = (raw: string): string[] =>
  raw
    .split(/\s*,\s*|\s+e\s+/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

const resolveStudentIds = (world: AcceptanceWorld, raw: string, { allowUnknown = false } = {}): string[] =>
  parseNameList(raw).map((name) => {
    const student = world.studentsByName.get(name);
    if (!student) {
      if (allowUnknown) return `unknown-${name}`;
      throw new Error(`Aluno ${name} não foi cadastrado neste cenário.`);
    }
    return student.id;
  });

const resolveGoalIds = (world: AcceptanceWorld, raw: string): string[] =>
  parseNameList(raw).map((name) => {
    const goal = world.goalsByName.get(name);
    if (!goal) throw new Error(`Meta ${name} não foi cadastrada neste cenário.`);
    return goal.id;
  });

// ================================================================
// Alunos
// ================================================================

When(
  "eu cadastrar o aluno {string} com CPF {string} e e-mail {string}",
  async function (this: AcceptanceWorld, name: string, cpf: string, email: string) {
    await ensureStudent(this, name, cpf, email);
  }
);

Given(
  "que existe o aluno {string} com CPF {string} e e-mail {string}",
  async function (this: AcceptanceWorld, name: string, cpf: string, email: string) {
    await ensureStudent(this, name, cpf, email);
    assertLastStatus(this, 201);
  }
);

When(
  "eu atualizar o aluno {string} para o e-mail {string}",
  async function (this: AcceptanceWorld, name: string, email: string) {
    const { app } = getTestContext();
    const student = this.studentsByName.get(name);
    assert.ok(student, `Aluno ${name} não foi encontrado.`);
    this.response = await request(app)
      .put(`/students/${student!.id}`)
      .send({ name, cpf: "52998224725", email });
  }
);

When(
  "eu remover o aluno {string}",
  async function (this: AcceptanceWorld, name: string) {
    const { app } = getTestContext();
    const student = this.studentsByName.get(name);
    assert.ok(student, `Aluno ${name} não foi encontrado.`);
    this.response = await request(app).delete(`/students/${student!.id}`);
  }
);

When("eu listar os alunos", async function (this: AcceptanceWorld) {
  const { app } = getTestContext();
  this.response = await request(app).get("/students");
});

Then(
  "o aluno retornado deve ter o nome {string}",
  function (this: AcceptanceWorld, name: string) {
    assert.equal(this.response?.body?.name, name);
  }
);

Then(
  "o aluno retornado deve ter o e-mail {string}",
  function (this: AcceptanceWorld, email: string) {
    assert.equal(this.response?.body?.email, email);
  }
);

Then(
  "a lista de alunos não deve conter {string}",
  function (this: AcceptanceWorld, name: string) {
    const list = (this.response?.body ?? []) as Array<{ name: string }>;
    assert.ok(
      !list.some((student) => student.name === name),
      `A lista ainda contém ${name}`
    );
  }
);

// ================================================================
// Metas
// ================================================================

Given("que existe a meta {string}", async function (this: AcceptanceWorld, name: string) {
  await ensureGoal(this, name);
  assertLastStatus(this, 201);
});

// ================================================================
// Turmas
// ================================================================

const createClass = async (
  world: AcceptanceWorld,
  {
    topic,
    year,
    semester,
    studentNames,
    goalNames,
    allowUnknown = false
  }: {
    topic: string;
    year: number;
    semester: 1 | 2;
    studentNames: string;
    goalNames: string;
    allowUnknown?: boolean;
  }
) => {
  const { app } = getTestContext();
  const studentIds = resolveStudentIds(world, studentNames, { allowUnknown });
  const goalIds = resolveGoalIds(world, goalNames);

  const response = await request(app).post("/classes").send({
    topic,
    year,
    semester,
    studentIds,
    goalIds
  });

  world.response = response;
  if (response.status === 201) {
    world.classesByTopic.set(topic, {
      id: response.body.id as string,
      topic,
      year,
      semester
    });
    world.lastClassId = response.body.id as string;
  }
};

When(
  "eu cadastrar a turma {string} em {int}\\/{int} com os alunos {string} e as metas {string}",
  async function (
    this: AcceptanceWorld,
    topic: string,
    year: number,
    semester: number,
    studentNames: string,
    goalNames: string
  ) {
    await createClass(this, {
      topic,
      year,
      semester: semester as 1 | 2,
      studentNames,
      goalNames
    });
  }
);

When(
  "eu tentar cadastrar a turma {string} em {int}\\/{int} com os alunos {string} e as metas {string}",
  async function (
    this: AcceptanceWorld,
    topic: string,
    year: number,
    semester: number,
    studentNames: string,
    goalNames: string
  ) {
    await createClass(this, {
      topic,
      year,
      semester: semester as 1 | 2,
      studentNames,
      goalNames,
      allowUnknown: true
    });
  }
);

Given(
  "que existe a turma {string} em {int}\\/{int} com os alunos {string} e as metas {string}",
  async function (
    this: AcceptanceWorld,
    topic: string,
    year: number,
    semester: number,
    studentNames: string,
    goalNames: string
  ) {
    await createClass(this, {
      topic,
      year,
      semester: semester as 1 | 2,
      studentNames,
      goalNames
    });
    assertLastStatus(this, 201);
  }
);

When(
  "eu atualizar a turma {string} para manter apenas a meta {string}",
  async function (this: AcceptanceWorld, topic: string, goalName: string) {
    const { app } = getTestContext();
    const classRef = this.classesByTopic.get(topic);
    assert.ok(classRef, `Turma ${topic} não encontrada.`);
    const goal = this.goalsByName.get(goalName);
    assert.ok(goal, `Meta ${goalName} não encontrada.`);

    const existing = await request(app).get(`/classes/${classRef!.id}`);
    const studentIds = (existing.body.studentIds ?? []) as string[];

    this.response = await request(app)
      .put(`/classes/${classRef!.id}`)
      .send({
        topic: classRef!.topic,
        year: classRef!.year,
        semester: classRef!.semester,
        studentIds,
        goalIds: [goal!.id]
      });
  }
);

Then(
  "a turma retornada deve ter o tema {string}",
  function (this: AcceptanceWorld, topic: string) {
    assert.equal(this.response?.body?.topic, topic);
  }
);

Then(
  "a turma retornada deve ter {int} aluno e {int} metas",
  function (this: AcceptanceWorld, studentCount: number, goalCount: number) {
    const body = this.response?.body as { studentIds: string[]; goalIds: string[] };
    assert.equal(body.studentIds.length, studentCount, "quantidade de alunos");
    assert.equal(body.goalIds.length, goalCount, "quantidade de metas");
  }
);

// ================================================================
// Avaliações
// ================================================================

const evaluate = async (
  world: AcceptanceWorld,
  {
    studentName,
    goalName,
    topic,
    level
  }: { studentName: string; goalName: string; topic: string; level: string }
) => {
  const { app } = getTestContext();
  const student = world.studentsByName.get(studentName);
  const goal = world.goalsByName.get(goalName);
  const classRef = world.classesByTopic.get(topic);
  assert.ok(student, `Aluno ${studentName} não encontrado.`);
  assert.ok(goal, `Meta ${goalName} não encontrada.`);
  assert.ok(classRef, `Turma ${topic} não encontrada.`);

  world.response = await request(app)
    .put(`/classes/${classRef!.id}/evaluations`)
    .send({ studentId: student!.id, goalId: goal!.id, level });
};

When(
  "eu avaliar o aluno {string} na meta {string} da turma {string} como {string}",
  async function (
    this: AcceptanceWorld,
    studentName: string,
    goalName: string,
    topic: string,
    level: string
  ) {
    await evaluate(this, { studentName, goalName, topic, level });
  }
);

When(
  "eu tentar avaliar o aluno {string} na meta {string} da turma {string} como {string}",
  async function (
    this: AcceptanceWorld,
    studentName: string,
    goalName: string,
    topic: string,
    level: string
  ) {
    await evaluate(this, { studentName, goalName, topic, level });
  }
);

Given(
  "que o aluno {string} foi avaliado na meta {string} da turma {string} como {string}",
  async function (
    this: AcceptanceWorld,
    studentName: string,
    goalName: string,
    topic: string,
    level: string
  ) {
    await evaluate(this, { studentName, goalName, topic, level });
    assertLastStatus(this, 200);
  }
);

Then(
  "a avaliação retornada deve ter o nível {string}",
  function (this: AcceptanceWorld, level: string) {
    assert.equal(this.response?.body?.level, level);
  }
);

Then(
  "a lista de avaliações da turma {string} deve conter {int} avaliação",
  async function (this: AcceptanceWorld, topic: string, count: number) {
    const { app } = getTestContext();
    const classRef = this.classesByTopic.get(topic);
    assert.ok(classRef, `Turma ${topic} não encontrada.`);
    const response = await request(app).get(`/classes/${classRef!.id}/evaluations`);
    const list = (response.body.evaluations ?? []) as unknown[];
    assert.equal(list.length, count);
  }
);

// ================================================================
// Digest de e-mail
// ================================================================

When("eu processar o resumo diário de avaliações", async function (this: AcceptanceWorld) {
  const { app } = getTestContext();
  this.response = await request(app).post("/email/digest").send({});
  if (this.response.status === 200) {
    this.digestResult = this.response.body;
  }
});

Then(
  "o resumo deve indicar {int} e-mail enviado",
  function (this: AcceptanceWorld, expected: number) {
    assert.equal(this.digestResult?.emailsSent, expected);
  }
);

Then(
  "o e-mail enviado deve ter como destinatário {string}",
  function (this: AcceptanceWorld, recipient: string) {
    const { emailService } = getTestContext();
    const sent = emailService.getSent();
    assert.ok(sent.length > 0, "Nenhum e-mail foi enviado.");
    assert.equal(sent[0].to, recipient);
  }
);

Then(
  "o e-mail enviado deve mencionar {string}",
  function (this: AcceptanceWorld, fragment: string) {
    const { emailService } = getTestContext();
    const sent = emailService.getSent();
    assert.ok(sent.length > 0, "Nenhum e-mail foi enviado.");
    const combined = `${sent[0].subject}\n${sent[0].text}\n${sent[0].html ?? ""}`;
    assert.ok(
      combined.includes(fragment),
      `O e-mail não menciona "${fragment}". Conteúdo:\n${combined}`
    );
  }
);
