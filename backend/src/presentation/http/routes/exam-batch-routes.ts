import { Router } from "express";

import { ExamBatchController } from "../controllers/exam-batch-controller";
import {
  examArtifactIdParamSchema,
  examBatchIdParamSchema
} from "../schemas/exam-batch-schemas";
import { asyncHandler } from "../utils/async-handler";
import { validateParams } from "../utils/validate-request";

export const createExamBatchRouter = (examBatchController: ExamBatchController): Router => {
  const router = Router();

  router.get(
    "/artifacts/:artifactId/download",
    validateParams(examArtifactIdParamSchema),
    asyncHandler(examBatchController.downloadArtifact)
  );

  router.get(
    "/:batchId",
    validateParams(examBatchIdParamSchema),
    asyncHandler(examBatchController.getById)
  );

  return router;
};
