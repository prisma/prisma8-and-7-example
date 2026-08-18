import type { ContentfulStatusCode } from "hono/utils/http-status";
import { Prisma } from "../generated/prisma/client.js";

export class ApiError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    message: string,
  ) {
    super(message);
  }
}

function isPrisma8UniqueEmailError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as Record<string, unknown>;
  return (
    candidate.name === "SqlQueryError" &&
    candidate.sqlState === "23505" &&
    candidate.constraint === "User_email_key"
  );
}

export function mapPrismaError(error: unknown): ApiError | undefined {
  if (isPrisma8UniqueEmailError(error)) {
    return new ApiError(409, "A user with that email already exists");
  }

  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return undefined;
  }

  switch (error.code) {
    case "P2002":
      return new ApiError(409, "A user with that email already exists");
    case "P2003":
      return new ApiError(400, "The referenced author does not exist");
    case "P2025":
      return new ApiError(404, "Resource not found");
    default:
      return undefined;
  }
}
