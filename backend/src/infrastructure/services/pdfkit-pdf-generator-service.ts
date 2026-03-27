import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

import PDFDocument from "pdfkit";

import { IPdfGeneratorService } from "../../application/services/pdf-generator-service";
import { AlternativeIdentificationType } from "../../domain/entities/alternative-identification-type";
import { ExamInstance } from "../../domain/entities/exam-instance";
import { ExamTemplate } from "../../domain/entities/exam-template";
import { GeneratedArtifact } from "../../domain/entities/generated-artifact";

const ensureDirectory = async (targetDir: string): Promise<void> => {
  await fsPromises.mkdir(targetDir, { recursive: true });
};

const FOOTER_MARGIN = 40;
const FOOTER_HEIGHT = 28;
const QUESTION_BOTTOM_GAP = 18;
const NAME_BLOCK_HEIGHT = 80;

const formatExamDate = (examDate: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(examDate);
  if (!match) {
    return examDate;
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
};

const buildResponsePlaceholder = (
  alternativeIdentificationType: AlternativeIdentificationType
): string => {
  if (alternativeIdentificationType === AlternativeIdentificationType.LETTERS) {
    return "Resposta do aluno: ______________________________";
  }

  return "Soma das potencias de 2: ______________________________";
};

const getContentBottom = (document: PDFKit.PDFDocument): number =>
  document.page.height - document.page.margins.bottom - FOOTER_MARGIN - FOOTER_HEIGHT;

const ensureSpace = (document: PDFKit.PDFDocument, heightNeeded: number): void => {
  if (document.y + heightNeeded > getContentBottom(document)) {
    document.addPage();
    document.y = document.page.margins.top;
  }
};

const drawExamHeader = (
  document: PDFKit.PDFDocument,
  examTemplate: ExamTemplate,
  examInstance: ExamInstance
): void => {
  const headerMetadata = examTemplate.headerMetadata;
  if (!headerMetadata) {
    return;
  }

  document
    .fontSize(18)
    .text(examTemplate.title, { align: "center" });
  document.moveDown(0.6);

  const leftColumnX = document.page.margins.left;
  const topY = document.y;
  const columnWidth = 220;

  document
    .fontSize(11)
    .text(`Disciplina: ${headerMetadata.discipline}`, leftColumnX, topY, {
      width: columnWidth
    })
    .text(`Professor: ${headerMetadata.teacher}`, leftColumnX, topY + 18, {
      width: columnWidth
    })
    .text(`Data: ${formatExamDate(headerMetadata.examDate)}`, leftColumnX, topY + 36, {
      width: columnWidth
    });

  document
    .fontSize(10)
    .text(`Codigo da prova: ${examInstance.examCode}`, 0, topY, {
      align: "right"
    });

  document.y = topY + 62;
  document
    .moveTo(document.page.margins.left, document.y)
    .lineTo(document.page.width - document.page.margins.right, document.y)
    .strokeColor("#CBD5E1")
    .lineWidth(1)
    .stroke();
  document.moveDown(1.1);
};

const drawStudentIdentificationBlock = (document: PDFKit.PDFDocument): void => {
  ensureSpace(document, NAME_BLOCK_HEIGHT);

  document
    .moveTo(document.page.margins.left, document.y)
    .lineTo(document.page.width - document.page.margins.right, document.y)
    .strokeColor("#CBD5E1")
    .lineWidth(1)
    .stroke();
  document.moveDown(0.8);

  document.fontSize(11).text("Nome do aluno: ______________________________________________");
  document.moveDown(0.7);
  document.fontSize(11).text("CPF: ______________________________________________");
};

const drawFooters = (document: PDFKit.PDFDocument, examCode: string): void => {
  const pageRange = document.bufferedPageRange();

  for (let index = 0; index < pageRange.count; index += 1) {
    document.switchToPage(index);

    const footerY = document.page.height - document.page.margins.bottom - FOOTER_MARGIN;

    document
      .moveTo(document.page.margins.left, footerY - 8)
      .lineTo(document.page.width - document.page.margins.right, footerY - 8)
      .strokeColor("#CBD5E1")
      .lineWidth(1)
      .stroke();

    document
      .fontSize(9)
      .fillColor("#475569")
      .text(
        `Prova ${examCode} - Pagina ${index + 1} de ${pageRange.count}`,
        document.page.margins.left,
        footerY,
        {
          align: "center",
          width: document.page.width - document.page.margins.left - document.page.margins.right
        }
      );
  }
};

const writePdfFile = async (
  filePath: string,
  examTemplate: ExamTemplate,
  examInstance: ExamInstance
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const document = new PDFDocument({
      margin: 50,
      bufferPages: true,
      compress: false
    });
    const outputStream = fs.createWriteStream(filePath);

    outputStream.on("finish", resolve);
    outputStream.on("error", reject);
    document.on("error", reject);
    document.pipe(outputStream);

    drawExamHeader(document, examTemplate, examInstance);

    const orderedQuestions = [...examInstance.randomizedQuestions].sort(
      (left, right) => left.position - right.position
    );

    for (const question of orderedQuestions) {
      ensureSpace(
        document,
        42 + question.randomizedOptions.length * 20 + QUESTION_BOTTOM_GAP
      );

      document
        .fontSize(12)
        .text(`${question.position}. ${question.statement}`, { continued: false });
      document.moveDown(0.25);

      for (const option of question.randomizedOptions) {
        document
          .fontSize(11)
          .text(`(${option.displayCode}) ${option.description}`, { indent: 16 });
      }

      document.moveDown(0.4);
      document
        .fontSize(10)
        .text(buildResponsePlaceholder(examInstance.alternativeIdentificationType), {
          indent: 16
        });
      document.moveDown(QUESTION_BOTTOM_GAP / 12);
    }

    drawStudentIdentificationBlock(document);
    drawFooters(document, examInstance.examCode);

    document.end();
  });
};

export class PdfKitPdfGeneratorService implements IPdfGeneratorService {
  async generateExamPdfs(
    _batchId: string,
    examTemplate: ExamTemplate,
    instances: ExamInstance[],
    outputDir: string
  ): Promise<GeneratedArtifact[]> {
    await ensureDirectory(outputDir);

    const artifacts: GeneratedArtifact[] = [];

    for (const instance of instances) {
      const fileName = `exam-${instance.examCode}.pdf`;
      const absolutePath = path.resolve(outputDir, fileName);

      await writePdfFile(absolutePath, examTemplate, instance);

      artifacts.push({
        kind: "PDF",
        fileName,
        absolutePath,
        mimeType: "application/pdf"
      });
    }

    return artifacts;
  }
}
