import { Router } from "express";

import { QuestionController } from "../controllers/question-controller";
import { questionBodySchema, questionIdParamSchema } from "../schemas/question-schemas";
import { asyncHandler } from "../utils/async-handler";
import { validateBody, validateParams } from "../utils/validate-request";

export const createQuestionRouter = (questionController: QuestionController): Router => {
  const router = Router();

  router.post("/", validateBody(questionBodySchema), asyncHandler(questionController.create));
  router.get("/", asyncHandler(questionController.list));
  router.get(
    "/:id",
    validateParams(questionIdParamSchema),
    asyncHandler(questionController.getById)
  );
  router.put(
    "/:id",
    validateParams(questionIdParamSchema),
    validateBody(questionBodySchema),
    asyncHandler(questionController.update)
  );
  router.delete(
    "/:id",
    validateParams(questionIdParamSchema),
    asyncHandler(questionController.delete)
  );

  return router;
};
