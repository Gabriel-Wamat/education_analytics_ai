CREATE TABLE "exam_instances" (
    "id" UUID NOT NULL,
    "batchId" TEXT NOT NULL,
    "examCode" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "templateId" UUID NOT NULL,
    "templateTitle" TEXT NOT NULL,
    "alternativeIdentificationType" "AlternativeIdentificationType" NOT NULL,
    "randomizedQuestions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_instances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "exam_instances_examCode_key" ON "exam_instances"("examCode");
CREATE INDEX "exam_instances_batchId_idx" ON "exam_instances"("batchId");
CREATE INDEX "exam_instances_templateId_idx" ON "exam_instances"("templateId");
CREATE UNIQUE INDEX "exam_instances_batchId_signature_key" ON "exam_instances"("batchId", "signature");

ALTER TABLE "exam_instances"
ADD CONSTRAINT "exam_instances_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "exam_templates"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
