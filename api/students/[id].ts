import type { IncomingMessage, ServerResponse } from "node:http";

import { handleExpressApiRequest } from "../../vercel/express-api-handler";

export default function handler(request: IncomingMessage, response: ServerResponse) {
  return handleExpressApiRequest(request, response);
}
