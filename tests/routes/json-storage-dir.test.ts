import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { resolveJsonStorageDir } from "../../backend/src/infrastructure/storage/json-storage-dir";

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

test("resolveJsonStorageDir copia os JSONs seed para /tmp na Vercel", () => {
  const originalEnv = { ...process.env };
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "json-storage-dir-test-"));
  const seedDir = path.join(tempDir, "seed-data");

  fs.mkdirSync(seedDir, { recursive: true });
  fs.writeFileSync(
    path.join(seedDir, "students.json"),
    JSON.stringify({ students: [{ id: "s1", name: "Ana" }] }),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(seedDir, "classes.json"),
    JSON.stringify({ classes: [{ id: "c1", topic: "Turma Alfa" }] }),
    "utf-8"
  );

  process.env.VERCEL = "1";
  process.env.JSON_STORAGE_DIR = path.relative(process.cwd(), seedDir);

  const resolvedDir = resolveJsonStorageDir();

  assert.equal(resolvedDir, "/tmp/json-storage");
  assert.equal(
    fs.readFileSync(path.join(resolvedDir, "students.json"), "utf-8"),
    JSON.stringify({ students: [{ id: "s1", name: "Ana" }] })
  );
  assert.equal(
    fs.readFileSync(path.join(resolvedDir, "classes.json"), "utf-8"),
    JSON.stringify({ classes: [{ id: "c1", topic: "Turma Alfa" }] })
  );

  fs.rmSync(resolvedDir, { recursive: true, force: true });
  fs.rmSync(tempDir, { recursive: true, force: true });
  restoreEnv(originalEnv);
});
