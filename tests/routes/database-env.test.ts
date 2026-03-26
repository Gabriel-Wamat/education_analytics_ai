import assert from "node:assert/strict";
import test from "node:test";

import {
  ensureDatabaseUrl,
  resolveDatabaseUrl
} from "../../backend/src/infrastructure/database/prisma/database-url";

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

test("resolveDatabaseUrl usa variáveis compatíveis quando DATABASE_URL não existe", () => {
  const originalEnv = { ...process.env };

  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.POSTGRES_URL_NON_POOLING;
  process.env.POSTGRES_PRISMA_URL = "postgresql://example/prisma";

  assert.equal(resolveDatabaseUrl(), "postgresql://example/prisma");

  restoreEnv(originalEnv);
});

test("ensureDatabaseUrl normaliza a variável DATABASE_URL", () => {
  const originalEnv = { ...process.env };

  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_PRISMA_URL;
  process.env.POSTGRES_URL_NON_POOLING = "postgresql://example/non-pooling";

  assert.equal(ensureDatabaseUrl(), "postgresql://example/non-pooling");
  assert.equal(process.env.DATABASE_URL, "postgresql://example/non-pooling");

  restoreEnv(originalEnv);
});
