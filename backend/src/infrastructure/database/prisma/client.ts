import { PrismaClient } from "@prisma/client";

import { ensureDatabaseUrl } from "./database-url";

export const createPrismaClient = (): PrismaClient => {
  ensureDatabaseUrl();
  return new PrismaClient();
};
