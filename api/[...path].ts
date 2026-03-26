import type { IncomingMessage, ServerResponse } from "node:http";

import { createApp } from "../backend/src/infrastructure/http/create-app";

const app = createApp();

export default function handler(request: IncomingMessage, response: ServerResponse) {
  if (typeof request.url === "string") {
    if (request.url === "/api") {
      request.url = "/";
    } else if (request.url.startsWith("/api/")) {
      request.url = request.url.slice(4) || "/";
    }
  }

  return app(request as never, response as never);
}
