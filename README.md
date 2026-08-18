# Prisma 7 and Prisma 8 Side by Side

This repository will demonstrate how to run Prisma 7 and Prisma 8 side by side. The README will document each step of that journey as the example evolves.

## Initial state

The repository began with a single REST API running only Prisma 7. Prisma 8 had not been added yet.

### Stack

- Node.js with TypeScript and ESM
- Hono with `@hono/node-server`
- Prisma `7.10.0-dev.58`
- `@prisma/client` and `@prisma/adapter-pg` at `7.10.0-dev.58`
- PostgreSQL 17 running through Docker Compose
- pnpm

Prisma uses the `prisma-client` generator and writes the generated client to `generated/prisma`. The application connects through Prisma's PostgreSQL driver adapter backed by `pg`.

### Data model

The starting schema has two related models:

- `User` — unique email, optional name, timestamps, and posts
- `Post` — title, optional content, published state, timestamps, and an author

Deleting a user cascades to their posts.

### API surface

The Hono application exposes:

- `GET /health`
- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `DELETE /users/:id`
- `GET /posts`
- `POST /posts`
- `GET /posts/:id`
- `PATCH /posts/:id`
- `DELETE /posts/:id`

Successful endpoint responses use HTTP 200. User responses include their posts, and post responses include their author.

This is the baseline from which Prisma 8 and the side-by-side configuration will be introduced.

## Step 1: Namespace the Prisma 7 CLI

The direct `prisma` development dependency is now `@prisma/prisma7` at `7.10.0-dev.58`. This package exposes the `prisma7` binary and keeps `prisma` at the same version as a transitive dependency. Giving Prisma 7 its own direct package, project-level binary, and config filename leaves the conventional project-level Prisma names available for adding Prisma 8 side by side later without ambiguity.

Concretely, this step:

- replaces the direct `prisma` dependency with `@prisma/prisma7`
- changes the generate and migration scripts to call `prisma7`
- renames `prisma.config.ts` to `prisma7.config.ts`
- changes the config import to `@prisma/prisma7/config`

## Step 2: Add Prisma 8 side by side

Prisma 8 is now installed as exact `prisma@8.0.0-rc.5` and `@prisma/orm-postgres@8.0.0-rc.3`. Its configuration and inferred database contract are separate from the Prisma 7 schema and config, and its emitted contract artifacts and PostgreSQL ORM runtime are kept separate from the generated Prisma 7 client and runtime.

The Users routes now use the Prisma 8 PostgreSQL ORM while the Posts routes continue to use Prisma 7. Both runtimes share the existing database schema and preserve the API's relations, but Prisma 7 remains the sole owner of migrations.
