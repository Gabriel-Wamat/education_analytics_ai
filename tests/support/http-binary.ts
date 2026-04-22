import { Response } from "superagent";

type ParseCallback = (error: Error | null, body?: Buffer) => void;

export const binaryParser = (response: Response, callback: ParseCallback): void => {
  const chunks: Buffer[] = [];

  response.on("data", (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });

  response.on("end", () => {
    callback(null, Buffer.concat(chunks));
  });

  response.on("error", (error) => {
    callback(error);
  });
};
