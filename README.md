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

The project compiles with `tsc` and runs the output with `node`, so `tsconfig.json` uses `"module": "NodeNext"` and every relative import ends in `.js`; a project run through `tsx` or a bundler can use `"module": "preserve"` with `"moduleResolution": "bundler"` instead and skip the extensions.

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

Prisma 8 is now installed as exact `prisma@8.0.0-rc.15` and `@prisma/orm-postgres@8.0.0-rc.11`. Its configuration and inferred database contract are separate from the Prisma 7 schema and config, and its emitted contract artifacts and PostgreSQL ORM runtime are kept separate from the generated Prisma 7 client and runtime.

The Users routes now use the Prisma 8 PostgreSQL ORM while the Posts routes continue to use Prisma 7. Both runtimes share the existing database schema and preserve the API's relations, but Prisma 7 remains the sole owner of migrations.

## Final step: Transfer migration ownership to Prisma 8

Prisma 8 now owns migration planning and application. The existing database was adopted with one command, `prisma db sign`, which verified that the live schema matches the emitted contract, wrote Prisma 8's marker in the database, stored the contract snapshot under `migrations/snapshots/`, and pointed the `db` ref (`migrations/app/refs/db.json`) at it. No migration was written at this point: the next `prisma migration plan` starts from the signed contract, writes a baseline package that records the adopted schema, and a second package with only the change.

Future migrations use the Prisma 8 migration scripts. Prisma 7 remains only for the Posts runtime and Prisma 7 client generation; its earlier migration files are retained as journey history but no longer drive migrations.
