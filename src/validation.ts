import type { Context } from "hono";
import { ApiError } from "./errors.js";

type JsonObject = Record<string, unknown>;

export async function readJsonObject(c: Context): Promise<JsonObject> {
  let value: unknown;
  try {
    value = await c.req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "Request body must be a JSON object");
  }
  return value as JsonObject;
}

export function parseId(rawId: string): number {
  if (!/^[1-9]\d*$/.test(rawId)) {
    throw new ApiError(400, "id must be a positive integer");
  }
  const id = Number(rawId);
  if (!Number.isSafeInteger(id)) {
    throw new ApiError(400, "id must be a positive integer");
  }
  return id;
}

export function assertOnlyKeys(body: JsonObject, allowed: readonly string[]): void {
  const unknown = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new ApiError(400, `Unknown field${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}`);
  }
}

export function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${field} is required and must be a non-empty string`);
  }
  return value.trim();
}

export function optionalNullableString(value: unknown, field: string): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value !== "string") {
    throw new ApiError(400, `${field} must be a string or null`);
  }
  return value;
}

export function requireEmail(value: unknown): string {
  const email = requireNonEmptyString(value, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "email must be a valid email address");
  }
  return email;
}

export function requirePositiveInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new ApiError(400, `${field} must be a positive integer`);
  }
  return value as number;
}

export function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new ApiError(400, `${field} must be a boolean`);
  }
  return value;
}

export function assertPatchHasFields(body: JsonObject): void {
  if (Object.keys(body).length === 0) {
    throw new ApiError(400, "At least one field must be provided");
  }
}
