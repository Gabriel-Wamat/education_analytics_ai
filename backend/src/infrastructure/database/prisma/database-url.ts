const databaseUrlCandidates = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL"
] as const;

export const resolveDatabaseUrl = (): string | undefined => {
  for (const key of databaseUrlCandidates) {
    const value = process.env[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
};

export const ensureDatabaseUrl = (): string => {
  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "Nenhuma URL de banco foi encontrada. Configure DATABASE_URL ou uma das variáveis compatíveis: POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING ou POSTGRES_URL."
    );
  }

  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
};
