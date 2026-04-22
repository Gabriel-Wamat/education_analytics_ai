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

const countNestedCollectionItems = (value: unknown): number => {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (!value || typeof value !== "object") {
    return 0;
  }

  return Object.values(value).reduce((total, item) => total + countNestedCollectionItems(item), 0);
};

const shouldRefreshSeedFile = (sourceFile: string, targetFile: string): boolean => {
  if (!fs.existsSync(sourceFile)) {
    return false;
  }

  if (!fs.existsSync(targetFile)) {
    return true;
  }

  try {
    const sourceContent = fs.readFileSync(sourceFile, "utf-8");
    const targetContent = fs.readFileSync(targetFile, "utf-8");

    if (targetContent.trim().length === 0) {
      return true;
    }

    const sourceCollections = countNestedCollectionItems(JSON.parse(sourceContent));
    const targetCollections = countNestedCollectionItems(JSON.parse(targetContent));

    return targetCollections === 0 && sourceCollections > 0;
  } catch {
    return true;
  }
};

const seedJsonStorage = (sourceDir: string, targetDir: string): void => {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const fileName of PEDAGOGICAL_STORAGE_FILES) {
    const sourceFile = path.join(sourceDir, fileName);
    const targetFile = path.join(targetDir, fileName);

    if (!shouldRefreshSeedFile(sourceFile, targetFile)) {
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
