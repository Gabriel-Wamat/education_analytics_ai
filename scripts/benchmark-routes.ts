import { performance } from "node:perf_hooks";
import fs from "node:fs/promises";

import request from "supertest";

import {
  BackendTestHarness,
  buildStudentResponsesCsvFromAnswerKey,
  createBackendTestHarness,
  createQuestionPayload
} from "../tests/route-support/backend-harness";

interface BenchmarkResult {
  route: string;
  method: string;
  iterations: number;
  meanMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
}

const round = (value: number): number => Number(value.toFixed(2));

const percentile = (values: number[], fraction: number): number => {
  const index = Math.min(values.length - 1, Math.ceil(values.length * fraction) - 1);
  return values[index] ?? 0;
};

const measure = async (
  iterations: number,
  fn: () => Promise<void>
): Promise<number[]> => {
  const durations: number[] = [];

  for (let index = 0; index < iterations; index += 1) {
    const startedAt = performance.now();
    await fn();
    durations.push(performance.now() - startedAt);
  }

  return durations;
};

const toBenchmarkResult = (
  method: string,
  route: string,
  iterations: number,
  durations: number[]
): BenchmarkResult => {
  const sortedDurations = [...durations].sort((left, right) => left - right);
  const total = sortedDurations.reduce((sum, value) => sum + value, 0);

  return {
    method,
    route,
    iterations,
    meanMs: round(total / sortedDurations.length),
    minMs: round(sortedDurations[0] ?? 0),
    maxMs: round(sortedDurations[sortedDurations.length - 1] ?? 0),
    p95Ms: round(percentile(sortedDurations, 0.95))
  };
};

const seedQuestion = async (harness: BackendTestHarness, suffix: string): Promise<string> => {
  const response = await request(harness.app)
    .post("/questions")
    .send(createQuestionPayload(suffix));

  if (response.status !== 201) {
    throw new Error(`Falha ao criar questão de benchmark: ${response.text}`);
  }

  return response.body.id as string;
};

const seedTemplate = async (
  harness: BackendTestHarness,
  questionIds: string[],
  title: string
): Promise<string> => {
  const response = await request(harness.app).post("/exam-templates").send({
    title,
    questionIds,
    alternativeIdentificationType: "LETTERS"
  });

  if (response.status !== 201) {
    throw new Error(`Falha ao criar prova de benchmark: ${response.text}`);
  }

  return response.body.id as string;
};

const seedGradedExam = async (
  harness: BackendTestHarness
): Promise<{
  examId: string;
  examTemplateId: string;
  answerKeyBuffer: Buffer;
  studentResponsesBuffer: Buffer;
}> => {
  const questionId = await seedQuestion(harness, "Benchmark");
  const examTemplateId = await seedTemplate(harness, [questionId], "Prova Benchmark");

  const generationResponse = await request(harness.app)
    .post(`/exam-templates/${examTemplateId}/generate`)
    .send({ quantity: 1 });

  if (generationResponse.status !== 201) {
    throw new Error(`Falha ao gerar prova de benchmark: ${generationResponse.text}`);
  }

  const answerKeyArtifact = generationResponse.body.artifacts.find(
    (artifact: { kind: string }) => artifact.kind === "CSV"
  ) as { absolutePath: string } | undefined;

  if (!answerKeyArtifact) {
    throw new Error("O benchmark não encontrou o CSV de gabarito gerado.");
  }

  const answerKeyBuffer = await fs.readFile(answerKeyArtifact.absolutePath);
  const studentResponsesCsv = buildStudentResponsesCsvFromAnswerKey(
    answerKeyBuffer.toString("utf-8"),
    "BENCH"
  );
  const studentResponsesBuffer = Buffer.from(studentResponsesCsv, "utf-8");

  const gradeResponse = await request(harness.app)
    .post("/exams/grade")
    .field("gradingStrategyType", "STRICT")
    .attach("answerKeyFile", answerKeyBuffer, {
      filename: "answer-key.csv",
      contentType: "text/csv"
    })
    .attach("studentResponsesFile", studentResponsesBuffer, {
      filename: "student-responses.csv",
      contentType: "text/csv"
    });

  if (gradeResponse.status !== 200) {
    throw new Error(`Falha ao corrigir prova de benchmark: ${gradeResponse.text}`);
  }

  return {
    examId: gradeResponse.body.examId as string,
    examTemplateId,
    answerKeyBuffer,
    studentResponsesBuffer
  };
};

const printResults = (results: BenchmarkResult[]): void => {
  const header = "| Método | Rota | Iterações | Média (ms) | Min (ms) | P95 (ms) | Máx (ms) |";
  const separator = "| --- | --- | ---: | ---: | ---: | ---: | ---: |";

  process.stdout.write(`${header}\n${separator}\n`);
  for (const result of results) {
    process.stdout.write(
      `| ${result.method} | ${result.route} | ${result.iterations} | ${result.meanMs} | ${result.minMs} | ${result.p95Ms} | ${result.maxMs} |\n`
    );
  }
};

const main = async (): Promise<void> => {
  const harness = await createBackendTestHarness();

  try {
    const results: BenchmarkResult[] = [];

    await harness.reset();
    results.push(
      toBenchmarkResult(
        "GET",
        "/health",
        25,
        await measure(25, async () => {
          await request(harness.app).get("/health").expect(200);
        })
      )
    );

    await harness.reset();
    for (let index = 0; index < 10; index += 1) {
      await seedQuestion(harness, `List ${index + 1}`);
    }
    results.push(
      toBenchmarkResult(
        "GET",
        "/questions",
        20,
        await measure(20, async () => {
          await request(harness.app).get("/questions").expect(200);
        })
      )
    );

    await harness.reset();
    let questionCounter = 0;
    results.push(
      toBenchmarkResult(
        "POST",
        "/questions",
        10,
        await measure(10, async () => {
          questionCounter += 1;
          await request(harness.app)
            .post("/questions")
            .send(createQuestionPayload(`Create ${questionCounter}`))
            .expect(201);
        })
      )
    );

    await harness.reset();
    const questionIds = await Promise.all([
      seedQuestion(harness, "Template 1"),
      seedQuestion(harness, "Template 2")
    ]);
    for (let index = 0; index < 5; index += 1) {
      await seedTemplate(harness, questionIds, `Template ${index + 1}`);
    }
    results.push(
      toBenchmarkResult(
        "GET",
        "/exam-templates",
        20,
        await measure(20, async () => {
          await request(harness.app).get("/exam-templates").expect(200);
        })
      )
    );

    await harness.reset();
    const templateQuestionIds = await Promise.all([
      seedQuestion(harness, "Generate 1"),
      seedQuestion(harness, "Generate 2"),
      seedQuestion(harness, "Generate 3")
    ]);
    const examTemplateId = await seedTemplate(harness, templateQuestionIds, "Template Generate");
    results.push(
      toBenchmarkResult(
        "POST",
        "/exam-templates/:id/generate",
        5,
        await measure(5, async () => {
          await request(harness.app)
            .post(`/exam-templates/${examTemplateId}/generate`)
            .send({ quantity: 2 })
            .expect(201);
        })
      )
    );

    await harness.reset();
    const { examId, answerKeyBuffer, studentResponsesBuffer } = await seedGradedExam(harness);
    results.push(
      toBenchmarkResult(
        "POST",
        "/exams/grade",
        5,
        await measure(5, async () => {
          await request(harness.app)
            .post("/exams/grade")
            .field("gradingStrategyType", "STRICT")
            .attach("answerKeyFile", answerKeyBuffer, {
              filename: "answer-key.csv",
              contentType: "text/csv"
            })
            .attach("studentResponsesFile", studentResponsesBuffer, {
              filename: "student-responses.csv",
              contentType: "text/csv"
            })
            .expect(200);
        })
      )
    );
    results.push(
      toBenchmarkResult(
        "GET",
        "/exams/:id/metrics",
        20,
        await measure(20, async () => {
          await request(harness.app).get(`/exams/${examId}/metrics`).expect(200);
        })
      )
    );
    results.push(
      toBenchmarkResult(
        "GET",
        "/exams/:id/insights",
        20,
        await measure(20, async () => {
          await request(harness.app).get(`/exams/${examId}/insights`).expect(200);
        })
      )
    );

    printResults(results);
  } finally {
    await harness.reset();
    await harness.close();
  }
};

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
