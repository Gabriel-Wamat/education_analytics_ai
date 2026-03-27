import fs from "node:fs/promises";
import path from "node:path";

import { ValidationError } from "../../application/errors/validation-error";
import {
  AnswerKeyRow,
  ICsvService,
  StudentResponseRow
} from "../../application/services/csv-service";
import { ExamInstance } from "../../domain/entities/exam-instance";
import { GeneratedArtifact } from "../../domain/entities/generated-artifact";
import {
  buildDisplayAnswer,
  buildExpectedStates
} from "../../domain/services/answer-normalizer";

const escapeCsvValue = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
};

const stringifyCsv = (rows: string[][]): string =>
  rows.map((row) => row.map((value) => escapeCsvValue(value)).join(",")).join("\n");

const parseCsv = (content: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const currentChar = content[index];
    const nextChar = content[index + 1];

    if (insideQuotes) {
      if (currentChar === '"' && nextChar === '"') {
        currentValue += '"';
        index += 1;
      } else if (currentChar === '"') {
        insideQuotes = false;
      } else {
        currentValue += currentChar;
      }
      continue;
    }

    if (currentChar === '"') {
      insideQuotes = true;
      continue;
    }

    if (currentChar === ",") {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if (currentChar === "\n") {
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    if (currentChar !== "\r") {
      currentValue += currentChar;
    }
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((value) => value.length > 0));
};

const parseRecords = (
  buffer: Buffer
): { header: string[]; records: Array<Record<string, string>> } => {
  const rows = parseCsv(buffer.toString("utf-8").replace(/^\uFEFF/, ""));
  if (rows.length === 0) {
    return { header: [], records: [] };
  }

  const [header, ...dataRows] = rows;
  return {
    header,
    records: dataRows.map((row) =>
      Object.fromEntries(header.map((columnName, index) => [columnName, row[index] ?? ""]))
    )
  };
};

const ensureDirectory = async (targetDir: string): Promise<void> => {
  await fs.mkdir(targetDir, { recursive: true });
};

const extractQuestionHeaders = (
  header: string[],
  prefixColumns: string[],
  fileLabel: string
): string[] => {
  if (header.length <= prefixColumns.length) {
    throw new ValidationError(`O arquivo de ${fileLabel} não possui colunas de questões.`);
  }

  const actualPrefix = header.slice(0, prefixColumns.length);
  if (actualPrefix.join(",") !== prefixColumns.join(",")) {
    throw new ValidationError(
      `O cabeçalho do arquivo de ${fileLabel} está inválido.`,
      [header.join(",")]
    );
  }

  const questionHeaders = header.slice(prefixColumns.length);
  for (let index = 0; index < questionHeaders.length; index += 1) {
    const expectedColumn = `q${index + 1}`;
    if (questionHeaders[index] !== expectedColumn) {
      throw new ValidationError(
        `O arquivo de ${fileLabel} deve usar colunas sequenciais q1..qN.`,
        [questionHeaders.join(",")]
      );
    }
  }

  return questionHeaders;
};

export class CsvFileService implements ICsvService {
  async generateAnswerKeyCsv(
    batchId: string,
    instances: ExamInstance[],
    outputDir: string
  ): Promise<GeneratedArtifact> {
    await ensureDirectory(outputDir);

    const fileName = `answer-key-${batchId}.csv`;
    const absolutePath = path.resolve(outputDir, fileName);

    const questionCount = instances[0]?.randomizedQuestions.length ?? 0;
    const headerRow = [
      "examCode",
      ...Array.from({ length: questionCount }, (_, index) => `q${index + 1}`)
    ];
    const rows: string[][] = [headerRow];

    for (const instance of instances) {
      const orderedQuestions = [...instance.randomizedQuestions].sort(
        (left, right) => left.position - right.position
      );

      rows.push([
        instance.examCode,
        ...orderedQuestions.map((question) =>
          buildDisplayAnswer(
            buildExpectedStates(question),
            question,
            instance.alternativeIdentificationType
          )
        )
      ]);
    }

    await fs.writeFile(absolutePath, stringifyCsv(rows), "utf-8");

    return {
      kind: "CSV",
      fileName,
      absolutePath,
      mimeType: "text/csv"
    };
  }

  async parseAnswerKey(file: Buffer): Promise<AnswerKeyRow[]> {
    const { header, records } = parseRecords(file);
    const questionHeaders = extractQuestionHeaders(header, ["examCode"], "gabarito");

    return records.map((record) => ({
      examCode: record.examCode,
      answers: questionHeaders.map((headerName) => record[headerName] ?? "")
    }));
  }

  async parseStudentResponses(file: Buffer): Promise<StudentResponseRow[]> {
    const { header, records } = parseRecords(file);
    const questionHeaders = extractQuestionHeaders(
      header,
      ["studentId", "studentName", "examCode"],
      "respostas dos alunos"
    );

    return records.map((record) => ({
      studentId: record.studentId,
      studentName: record.studentName || undefined,
      examCode: record.examCode,
      answers: questionHeaders.map((headerName) => record[headerName] ?? "")
    }));
  }
}
