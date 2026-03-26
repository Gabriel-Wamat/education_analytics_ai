import { Router } from "express";
import multer from "multer";

import { ExamController } from "../controllers/exam-controller";
import { examIdParamSchema, gradeExamBodySchema } from "../schemas/exam-schemas";
import { asyncHandler } from "../utils/async-handler";
import { validateBody, validateParams } from "../utils/validate-request";

const upload = multer({
  storage: multer.memoryStorage()
});

export const createExamRouter = (examController: ExamController): Router => {
  const router = Router();

  router.post(
    "/grade",
    upload.fields([
      { name: "answerKeyFile", maxCount: 1 },
      { name: "studentResponsesFile", maxCount: 1 }
    ]),
    validateBody(gradeExamBodySchema),
    asyncHandler(examController.grade)
  );
  router.get(
    "/:id/metrics",
    validateParams(examIdParamSchema),
    asyncHandler(examController.getMetrics)
  );
  router.get(
    "/:id/insights",
    validateParams(examIdParamSchema),
    asyncHandler(examController.getInsights)
  );

  return router;
};
