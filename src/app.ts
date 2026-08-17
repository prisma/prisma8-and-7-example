import { Hono } from "hono";
import type { PrismaClient } from "../generated/prisma/client.js";
import { ApiError, mapPrismaError } from "./errors.js";
import { postsRoutes } from "./routes/posts.js";
import { usersRoutes } from "./routes/users.js";

export function createApp(prisma: PrismaClient): Hono {
  const app = new Hono();

  app.get("/health", async (c) => {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: "ok", database: "connected" });
  });

  app.route("/users", usersRoutes(prisma));
  app.route("/posts", postsRoutes(prisma));

  app.notFound((c) => c.json({ error: "Route not found" }, 404));

  app.onError((error, c) => {
    const apiError = error instanceof ApiError ? error : mapPrismaError(error);
    if (apiError) {
      return c.json({ error: apiError.message }, apiError.status);
    }

    console.error("Unhandled request error", error);
    return c.json({ error: "Internal server error" }, 500);
  });

  return app;
}
