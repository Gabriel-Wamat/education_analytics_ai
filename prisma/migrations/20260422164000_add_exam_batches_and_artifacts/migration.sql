-- CreateEnum
CREATE TYPE "GeneratedArtifactKind" AS ENUM ('PDF', 'CSV');

-- CreateTable
CREATE TABLE "exam_batches" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "templateTitle" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_artifacts" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "kind" "GeneratedArtifactKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "absolutePath" TEXT,
    "sizeInBytes" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_batches_templateId_idx" ON "exam_batches"("templateId");

-- CreateIndex
CREATE INDEX "exam_artifacts_batchId_idx" ON "exam_artifacts"("batchId");

-- AddForeignKey
ALTER TABLE "exam_batches" ADD CONSTRAINT "exam_batches_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "exam_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_artifacts" ADD CONSTRAINT "exam_artifacts_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "exam_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
