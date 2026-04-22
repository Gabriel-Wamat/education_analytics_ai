import fs from "node:fs";
import path from "node:path";

const PEDAGOGICAL_STORAGE_FILES = [
  "students.json",
  "goals.json",
  "classes.json",
  "evaluations.json",
  "email-digest-queue.json",
  "email-log.json"
] as const;

const isVercelRuntime = (): boolean =>
  process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

const seedJsonStorage = (sourceDir: string, targetDir: string): void => {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const fileName of PEDAGOGICAL_STORAGE_FILES) {
    const sourceFile = path.join(sourceDir, fileName);
    const targetFile = path.join(targetDir, fileName);

    if (fs.existsSync(targetFile) || !fs.existsSync(sourceFile)) {
      continue;
    }

    fs.copyFileSync(sourceFile, targetFile);
  }
};

export const resolveJsonStorageDir = (override?: string): string => {
  if (override) {
    return override;
  }

  const bundledDataDir = path.resolve(process.cwd(), process.env.JSON_STORAGE_DIR ?? "data");

  if (!isVercelRuntime()) {
    return bundledDataDir;
  }

  const runtimeDataDir = path.resolve("/tmp/json-storage");
  seedJsonStorage(bundledDataDir, runtimeDataDir);
  return runtimeDataDir;
};
