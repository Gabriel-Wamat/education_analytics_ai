CREATE TYPE "AlternativeIdentificationType" AS ENUM ('LETTERS', 'POWERS_OF_2');

CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "statement" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "options" (
    "id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "questionId" UUID NOT NULL,

    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_templates" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "alternativeIdentificationType" "AlternativeIdentificationType" NOT NULL,
    "questionsSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_templates_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "options"
ADD CONSTRAINT "options_questionId_fkey"
FOREIGN KEY ("questionId") REFERENCES "questions"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
