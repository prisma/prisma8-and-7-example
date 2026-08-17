import { Hono } from "hono";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../errors.js";
import {
  assertOnlyKeys,
  assertPatchHasFields,
  optionalBoolean,
  optionalNullableString,
  parseId,
  readJsonObject,
  requireNonEmptyString,
  requirePositiveInteger,
} from "../validation.js";

export function postsRoutes(prisma: PrismaClient): Hono {
  const posts = new Hono();

  posts.get("/", async (c) => {
    const result = await prisma.post.findMany({
      include: { author: true },
      orderBy: { id: "asc" },
    });
    return c.json(result);
  });

  posts.post("/", async (c) => {
    const body = await readJsonObject(c);
    assertOnlyKeys(body, ["title", "content", "published", "authorId"]);
    const title = requireNonEmptyString(body.title, "title");
    const authorId = requirePositiveInteger(body.authorId, "authorId");
    const content = optionalNullableString(body.content, "content");
    const published = optionalBoolean(body.published, "published");

    const post = await prisma.post.create({
      data: {
        title,
        authorId,
        ...(content !== undefined ? { content } : {}),
        ...(published !== undefined ? { published } : {}),
      },
      include: { author: true },
    });
    return c.json(post);
  });

  posts.get("/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    const post = await prisma.post.findUnique({ where: { id }, include: { author: true } });
    if (!post) {
      throw new ApiError(404, "Post not found");
    }
    return c.json(post);
  });

  posts.patch("/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    const body = await readJsonObject(c);
    assertOnlyKeys(body, ["title", "content", "published", "authorId"]);
    assertPatchHasFields(body);

    const existing = await prisma.post.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new ApiError(404, "Post not found");
    }

    const data: { title?: string; content?: string | null; published?: boolean; authorId?: number } = {};
    if (Object.hasOwn(body, "title")) data.title = requireNonEmptyString(body.title, "title");
    if (Object.hasOwn(body, "content")) data.content = optionalNullableString(body.content, "content") ?? null;
    if (Object.hasOwn(body, "published")) data.published = optionalBoolean(body.published, "published");
    if (Object.hasOwn(body, "authorId")) data.authorId = requirePositiveInteger(body.authorId, "authorId");

    const post = await prisma.post.update({
      where: { id },
      data,
      include: { author: true },
    });
    return c.json(post);
  });

  posts.delete("/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    const existing = await prisma.post.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new ApiError(404, "Post not found");
    }
    await prisma.post.delete({ where: { id } });
    return c.json({ success: true });
  });

  return posts;
}
