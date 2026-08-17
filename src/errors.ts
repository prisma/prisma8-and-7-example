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

export function mapPrismaError(error: unknown): ApiError | undefined {
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
