import { Router } from "express";

import { GoalController } from "../controllers/goal-controller";
import { goalBodySchema, goalIdParamSchema } from "../schemas/goal-schemas";
import { asyncHandler } from "../utils/async-handler";
import { validateBody, validateParams } from "../utils/validate-request";

export const createGoalRouter = (controller: GoalController): Router => {
  const router = Router();
  router.post("/", validateBody(goalBodySchema), asyncHandler(controller.create));
  router.get("/", asyncHandler(controller.list));
  router.put(
    "/:id",
    validateParams(goalIdParamSchema),
    validateBody(goalBodySchema),
    asyncHandler(controller.update)
  );
  router.delete("/:id", validateParams(goalIdParamSchema), asyncHandler(controller.delete));
  return router;
};
