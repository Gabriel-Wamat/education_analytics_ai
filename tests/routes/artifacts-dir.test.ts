import assert from "node:assert/strict";
import test from "node:test";

import { resolveArtifactsBaseDir } from "../../backend/src/infrastructure/http/create-app";

const restoreEnv = (snapshot: NodeJS.ProcessEnv) => {
  for (const key of Object.keys(process.env)) {
    if (!(key in snapshot)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(snapshot)) {
    if (typeof value === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

test("resolveArtifactsBaseDir usa /tmp na Vercel", () => {
  const originalEnv = { ...process.env };

  process.env.VERCEL = "1";
  delete process.env.VERCEL_ENV;

  assert.equal(resolveArtifactsBaseDir(), "/tmp/exam-batches");

  restoreEnv(originalEnv);
});

test("resolveArtifactsBaseDir usa output local fora da Vercel", () => {
  const originalEnv = { ...process.env };

  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;

  assert.match(resolveArtifactsBaseDir(), /output\/exam-batches$/);

  restoreEnv(originalEnv);
});
