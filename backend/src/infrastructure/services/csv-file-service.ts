import fs from "node:fs/promises";
import path from "node:path";

import {
  AnswerKeyRow,
  ICsvService,
  StudentResponseRow
} from "../../application/services/csv-service";
import { ExamInstance } from "../../domain/entities/exam-instance";
import { GeneratedArtifact } from "../../domain/entities/generated-artifact";
import {
  buildCorrectOptionPositions,
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

const parseRecords = (buffer: Buffer): Array<Record<string, string>> => {
  const rows = parseCsv(buffer.toString("utf-8").replace(/^\uFEFF/, ""));
  if (rows.length === 0) {
    return [];
  }

  const [header, ...dataRows] = rows;
  return dataRows.map((row) =>
    Object.fromEntries(header.map((columnName, index) => [columnName, row[index] ?? ""]))
  );
};

const ensureDirectory = async (targetDir: string): Promise<void> => {
  await fs.mkdir(targetDir, { recursive: true });
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

    const rows: string[][] = [
      [
        "examCode",
        "questionPosition",
        "questionId",
        "alternativeIdentificationType",
        "correctDisplayAnswer",
        "correctOptionPositions"
      ]
    ];

    for (const instance of instances) {
      for (const question of instance.randomizedQuestions) {
        rows.push([
          instance.examCode,
          String(question.position),
          question.originalQuestionId,
          instance.alternativeIdentificationType,
          buildDisplayAnswer(
            buildExpectedStates(question),
            question,
            instance.alternativeIdentificationType
          ),
          buildCorrectOptionPositions(question)
        ]);
      }
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
    const records = parseRecords(file);

    return records.map((record) => ({
      examCode: record.examCode,
      questionPosition: Number(record.questionPosition),
      questionId: record.questionId,
      alternativeIdentificationType: record.alternativeIdentificationType,
      correctDisplayAnswer: record.correctDisplayAnswer,
      correctOptionPositions: record.correctOptionPositions
    }));
  }

  async parseStudentResponses(file: Buffer): Promise<StudentResponseRow[]> {
    const records = parseRecords(file);

    return records.map((record) => ({
      studentId: record.studentId,
      studentName: record.studentName || undefined,
      examCode: record.examCode,
      questionPosition: Number(record.questionPosition),
      markedAnswer: record.markedAnswer ?? ""
    }));
  }
}
