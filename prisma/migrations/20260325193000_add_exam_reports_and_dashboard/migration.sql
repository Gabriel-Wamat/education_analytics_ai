CREATE TYPE "GradingStrategyType" AS ENUM ('STRICT', 'PROPORTIONAL');

CREATE TABLE "exam_reports" (
    "id" UUID NOT NULL,
    "batchId" TEXT NOT NULL,
    "templateId" UUID NOT NULL,
    "templateTitle" TEXT NOT NULL,
    "gradingStrategyType" "GradingStrategyType" NOT NULL,
    "studentsSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "exam_reports_batchId_idx" ON "exam_reports"("batchId");
CREATE INDEX "exam_reports_templateId_idx" ON "exam_reports"("templateId");

ALTER TABLE "exam_reports"
ADD CONSTRAINT "exam_reports_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "exam_templates"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
