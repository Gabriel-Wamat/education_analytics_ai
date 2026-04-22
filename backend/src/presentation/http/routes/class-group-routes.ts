import { Router } from "express";

import { ClassGroupController } from "../controllers/class-group-controller";
import {
  classGroupBodySchema,
  classGroupIdParamSchema,
  evaluationBodySchema
} from "../schemas/class-group-schemas";
import { asyncHandler } from "../utils/async-handler";
import { validateBody, validateParams } from "../utils/validate-request";

export const createClassGroupRouter = (controller: ClassGroupController): Router => {
  const router = Router();
  router.post("/", validateBody(classGroupBodySchema), asyncHandler(controller.create));
  router.get("/", asyncHandler(controller.list));
  router.get("/:id", validateParams(classGroupIdParamSchema), asyncHandler(controller.getById));
  router.put(
    "/:id",
    validateParams(classGroupIdParamSchema),
    validateBody(classGroupBodySchema),
    asyncHandler(controller.update)
  );
  router.delete(
    "/:id",
    validateParams(classGroupIdParamSchema),
    asyncHandler(controller.delete)
  );
  router.get(
    "/:id/evaluations",
    validateParams(classGroupIdParamSchema),
    asyncHandler(controller.listEvaluations)
  );
  router.put(
    "/:id/evaluations",
    validateParams(classGroupIdParamSchema),
    validateBody(evaluationBodySchema),
    asyncHandler(controller.setEvaluation)
  );
  return router;
};
