import type { IncomingMessage, ServerResponse } from "node:http";

import { createApp } from "../backend/src/infrastructure/http/create-app";

const app = createApp();

const normalizeRequestUrl = (requestUrl: string | undefined): string => {
  const url = new URL(requestUrl ?? "/", "http://localhost");
  const pathname = url.pathname === "/api" ? "/" : url.pathname.replace(/^\/api/, "") || "/";

  return `${pathname}${url.search}`;
};

export const handleExpressApiRequest = (
  request: IncomingMessage,
  response: ServerResponse
): unknown => {
  request.url = normalizeRequestUrl(request.url);

  return app(request as never, response as never);
};
