import { Router } from "express";

import { StudentController } from "../controllers/student-controller";
import { studentBodySchema, studentIdParamSchema } from "../schemas/student-schemas";
import { asyncHandler } from "../utils/async-handler";
import { validateBody, validateParams } from "../utils/validate-request";

export const createStudentRouter = (controller: StudentController): Router => {
  const router = Router();
  router.post("/", validateBody(studentBodySchema), asyncHandler(controller.create));
  router.get("/", asyncHandler(controller.list));
  router.get("/:id", validateParams(studentIdParamSchema), asyncHandler(controller.getById));
  router.put(
    "/:id",
    validateParams(studentIdParamSchema),
    validateBody(studentBodySchema),
    asyncHandler(controller.update)
  );
  router.delete("/:id", validateParams(studentIdParamSchema), asyncHandler(controller.delete));
  return router;
};
