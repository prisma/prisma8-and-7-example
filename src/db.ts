import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import postgres from "@prisma/orm-postgres/runtime";
import { Pool } from "pg";
import type { Contract } from "../generated/prisma8/contract.js";
import contractJson from "../generated/prisma8/contract.json" with { type: "json" };
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const prisma7Pool = new Pool({ connectionString });
const prisma7Adapter = new PrismaPg(prisma7Pool, { disposeExternalPool: true });

export const prisma7 = new PrismaClient({ adapter: prisma7Adapter });
export const prisma8 = postgres<Contract>({ url: connectionString, contractJson });

export type Prisma8Orm = typeof prisma8.orm;

export async function closeDatabases(): Promise<void> {
  await Promise.all([prisma7.$disconnect(), prisma8.close()]);
}
