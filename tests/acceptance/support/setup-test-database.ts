import { spawn } from "node:child_process";
import path from "node:path";

import { Client } from "pg";

const runPrismaCli = async (args: string[]): Promise<void> => {
  const prismaCliPath = require.resolve("prisma/build/index.js");

  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn(process.execPath, [prismaCliPath, ...args], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit"
    });

    childProcess.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`O comando do Prisma falhou com código ${code}.`));
    });

    childProcess.on("error", reject);
  });
};

export const setupTestDatabase = async (): Promise<void> => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("A variável DATABASE_URL é obrigatória para os testes.");
  }

  const parsedUrl = new URL(databaseUrl);
  const databaseName = parsedUrl.pathname.replace(/^\//, "");
  if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
    throw new Error("O nome do banco de testes contém caracteres não suportados.");
  }

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";

  const adminClient = new Client({
    connectionString: adminUrl.toString()
  });

  await adminClient.connect();

  const existingDatabase = await adminClient.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [databaseName]
  );

  if (existingDatabase.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE "${databaseName}"`);
  }

  await adminClient.end();

  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  await runPrismaCli(["generate", "--schema", schemaPath]);
  await runPrismaCli(["migrate", "deploy", "--schema", schemaPath]);
};
