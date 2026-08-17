import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { closeDatabase, prisma } from "./db.js";

const configuredPort = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const app = createApp(prisma);
const server = serve({ fetch: app.fetch, port: configuredPort }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down`);

  server.close(async (serverError) => {
    try {
      await closeDatabase();
    } catch (databaseError) {
      console.error("Failed to close the database cleanly", databaseError);
      process.exitCode = 1;
    }
    if (serverError) {
      console.error("Failed to close the HTTP server cleanly", serverError);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
