import { Router } from "express";

import { EmailDigestController } from "../controllers/email-digest-controller";
import { asyncHandler } from "../utils/async-handler";

export const createEmailDigestRouter = (controller: EmailDigestController): Router => {
  const router = Router();
  router.get("/messages", asyncHandler(controller.listMessages));
  router.post("/digest", asyncHandler(controller.process));
  return router;
};
