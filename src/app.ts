import { Hono } from "hono";
import type { PrismaClient } from "../generated/prisma/client";
import type { Prisma8Orm } from "./db";
import { ApiError, mapPrismaError } from "./errors";
import { postsRoutes } from "./routes/posts";
import { usersRoutes } from "./routes/users";

export function createApp(prisma7: PrismaClient, prisma8Orm: Prisma8Orm): Hono {
  const app = new Hono();

  app.get("/health", async (c) => {
    await prisma7.$queryRaw`SELECT 1`;
    return c.json({ status: "ok", database: "connected" });
  });

  app.route("/users", usersRoutes(prisma8Orm));
  app.route("/posts", postsRoutes(prisma7));

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
