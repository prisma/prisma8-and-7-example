import { Hono } from "hono";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../errors.js";
import {
  assertOnlyKeys,
  assertPatchHasFields,
  optionalNullableString,
  parseId,
  readJsonObject,
  requireEmail,
} from "../validation.js";

export function usersRoutes(prisma: PrismaClient): Hono {
  const users = new Hono();

  users.get("/", async (c) => {
    const result = await prisma.user.findMany({
      include: { posts: { orderBy: { id: "asc" } } },
      orderBy: { id: "asc" },
    });
    return c.json(result);
  });

  users.post("/", async (c) => {
    const body = await readJsonObject(c);
    assertOnlyKeys(body, ["email", "name"]);
    const email = requireEmail(body.email);
    const name = optionalNullableString(body.name, "name");

    const user = await prisma.user.create({
      data: { email, ...(name !== undefined ? { name } : {}) },
      include: { posts: true },
    });
    return c.json(user);
  });

  users.get("/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    const user = await prisma.user.findUnique({
      where: { id },
      include: { posts: { orderBy: { id: "asc" } } },
    });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return c.json(user);
  });

  users.patch("/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    const body = await readJsonObject(c);
    assertOnlyKeys(body, ["email", "name"]);
    assertPatchHasFields(body);

    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new ApiError(404, "User not found");
    }

    const data: { email?: string; name?: string | null } = {};
    if (Object.hasOwn(body, "email")) data.email = requireEmail(body.email);
    if (Object.hasOwn(body, "name")) data.name = optionalNullableString(body.name, "name") ?? null;

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { posts: { orderBy: { id: "asc" } } },
    });
    return c.json(user);
  });

  users.delete("/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new ApiError(404, "User not found");
    }
    await prisma.user.delete({ where: { id } });
    return c.json({ success: true });
  });

  return users;
}
