import { Hono } from "hono";
import type { FieldOutputTypes } from "../../generated/prisma8/contract.js";
import type { Prisma8Orm } from "../db.js";
import { ApiError } from "../errors.js";
import {
  assertOnlyKeys,
  assertPatchHasFields,
  optionalNullableString,
  parseId,
  readJsonObject,
  requireEmail,
} from "../validation.js";

type UserTimestamp = FieldOutputTypes["public"]["User"]["updatedAt"];

function currentTimestamp(): UserTimestamp {
  return new Date().toISOString() as UserTimestamp;
}

export function usersRoutes(orm: Prisma8Orm): Hono {
  const users = new Hono();

  users.get("/", async (c) => {
    const result = await orm.public.User.include("posts", (posts) =>
      posts.orderBy((post) => post.id.asc()),
    )
      .orderBy((user) => user.id.asc())
      .all();
    return c.json(result);
  });

  users.post("/", async (c) => {
    const body = await readJsonObject(c);
    assertOnlyKeys(body, ["email", "name"]);
    const email = requireEmail(body.email);
    const name = optionalNullableString(body.name, "name");

    const user = await orm.public.User.include("posts").create({
      email,
      updatedAt: currentTimestamp(),
      ...(name !== undefined ? { name } : {}),
    });
    return c.json(user);
  });

  users.get("/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    const user = await orm.public.User.include("posts", (posts) =>
      posts.orderBy((post) => post.id.asc()),
    ).first({ id });
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

    const data: { email?: string; name?: string | null; updatedAt: UserTimestamp } = {
      updatedAt: currentTimestamp(),
    };
    if (Object.hasOwn(body, "email")) data.email = requireEmail(body.email);
    if (Object.hasOwn(body, "name")) data.name = optionalNullableString(body.name, "name") ?? null;

    const user = await orm.public.User.include("posts", (posts) =>
      posts.orderBy((post) => post.id.asc()),
    )
      .where({ id })
      .update(data);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return c.json(user);
  });

  users.delete("/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    const deleted = await orm.public.User.where({ id }).delete();
    if (!deleted) {
      throw new ApiError(404, "User not found");
    }
    return c.json({ success: true });
  });

  return users;
}
