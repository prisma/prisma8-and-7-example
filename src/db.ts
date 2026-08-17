import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool, { disposeExternalPool: true });

export const prisma = new PrismaClient({ adapter });

export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
}
