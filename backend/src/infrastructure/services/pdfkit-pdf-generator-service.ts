import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

import PDFDocument from "pdfkit";

import { IPdfGeneratorService } from "../../application/services/pdf-generator-service";
import { AlternativeIdentificationType } from "../../domain/entities/alternative-identification-type";
import { ExamInstance } from "../../domain/entities/exam-instance";
import { GeneratedArtifact } from "../../domain/entities/generated-artifact";

const ensureDirectory = async (targetDir: string): Promise<void> => {
  await fsPromises.mkdir(targetDir, { recursive: true });
};

const buildResponsePlaceholder = (
  alternativeIdentificationType: AlternativeIdentificationType
): string => {
  if (alternativeIdentificationType === AlternativeIdentificationType.LETTERS) {
    return "Resposta do aluno: ______________________________";
  }

  return "Soma das potencias de 2: ______________________________";
};

const writePdfFile = async (filePath: string, examInstance: ExamInstance): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const document = new PDFDocument({ margin: 50 });
    const outputStream = fs.createWriteStream(filePath);

    outputStream.on("finish", resolve);
    outputStream.on("error", reject);
    document.on("error", reject);
    document.pipe(outputStream);

    document.fontSize(18).text("Sistema de Provas", { align: "center" });
    document.moveDown(0.5);
    document.fontSize(14).text(examInstance.templateTitle, { align: "center" });
    document.moveDown(0.5);
    document
      .fontSize(10)
      .text(`Codigo da prova: ${examInstance.examCode}`, { align: "right" });
    document.moveDown(1);

    for (const question of examInstance.randomizedQuestions) {
      if (document.y > 680) {
        document.addPage();
      }

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
      document.moveDown(1);
    }

    document
      .fontSize(9)
      .text(`Rodape: prova ${examInstance.examCode}`, 50, 760, { align: "center" });

    document.end();
  });
};

export class PdfKitPdfGeneratorService implements IPdfGeneratorService {
  async generateExamPdfs(
    _batchId: string,
    instances: ExamInstance[],
    outputDir: string
  ): Promise<GeneratedArtifact[]> {
    await ensureDirectory(outputDir);

    const artifacts: GeneratedArtifact[] = [];

    for (const instance of instances) {
      const fileName = `exam-${instance.examCode}.pdf`;
      const absolutePath = path.resolve(outputDir, fileName);

      await writePdfFile(absolutePath, instance);

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
