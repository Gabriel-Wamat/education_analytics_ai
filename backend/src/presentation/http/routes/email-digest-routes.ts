import { Router } from "express";

import { EmailDigestController } from "../controllers/email-digest-controller";
import { sendManualEmailBodySchema } from "../schemas/email-schemas";
import { asyncHandler } from "../utils/async-handler";
import { validateBody } from "../utils/validate-request";

export const createEmailDigestRouter = (controller: EmailDigestController): Router => {
  const router = Router();
  router.get("/messages", asyncHandler(controller.listMessages));
  router.post("/digest", asyncHandler(controller.process));
  router.post(
    "/send",
    validateBody(sendManualEmailBodySchema),
    asyncHandler(controller.sendManual)
  );
  return router;
};
