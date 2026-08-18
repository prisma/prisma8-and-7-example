import "dotenv/config";
import { defineConfig } from "@prisma/cli-engine";
import { defineConfig as definePostgresConfig } from "@prisma/orm-postgres/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  orm: definePostgresConfig({
    contract: "prisma8/contract.prisma",
    output: resolve(projectRoot, "generated/prisma8"),
    db: {
      connection: process.env["DATABASE_URL"],
    },
  }),
});
