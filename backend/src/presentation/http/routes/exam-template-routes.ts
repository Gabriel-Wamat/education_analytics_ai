import { Router } from "express";

import { ExamTemplateController } from "../controllers/exam-template-controller";
import {
  examTemplateBodySchema,
  examTemplateIdParamSchema,
  generateExamInstancesBodySchema
} from "../schemas/exam-template-schemas";
import { asyncHandler } from "../utils/async-handler";
import { validateBody, validateParams } from "../utils/validate-request";

export const createExamTemplateRouter = (
  examTemplateController: ExamTemplateController
): Router => {
  const router = Router();

  router.post("/", validateBody(examTemplateBodySchema), asyncHandler(examTemplateController.create));
  router.get("/", asyncHandler(examTemplateController.list));
  router.post(
    "/:id/generate",
    validateParams(examTemplateIdParamSchema),
    validateBody(generateExamInstancesBodySchema),
    asyncHandler(examTemplateController.generateInstances)
  );
  router.get(
    "/:id",
    validateParams(examTemplateIdParamSchema),
    asyncHandler(examTemplateController.getById)
  );
  router.put(
    "/:id",
    validateParams(examTemplateIdParamSchema),
    validateBody(examTemplateBodySchema),
    asyncHandler(examTemplateController.update)
  );
  router.delete(
    "/:id",
    validateParams(examTemplateIdParamSchema),
    asyncHandler(examTemplateController.delete)
  );

  return router;
};
