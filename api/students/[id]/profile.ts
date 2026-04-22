import type { VercelRequest, VercelResponse } from "@vercel/node";

import { handleExpressApiRequest } from "../../../vercel/express-api-handler";

export default function handler(request: VercelRequest, response: VercelResponse) {
  return handleExpressApiRequest(request, response);
}
