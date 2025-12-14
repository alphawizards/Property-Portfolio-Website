import { TRPCError } from "@trpc/server";
import { ZodError } from "zod";

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  BAD_REQUEST: "BAD_REQUEST",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  CONFLICT: "CONFLICT",
  PRECONDITION_FAILED: "PRECONDITION_FAILED",
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleDatabaseError(error: unknown, context: string): never {
  console.error(`[Database Error] ${context}:`, error);

  if (error instanceof AppError) {
    throw new TRPCError({
      code: error.code,
      message: error.message,
      cause: error.cause,
    });
  }

  // Handle unique constraint violations (Postgres specific code usually '23505')
  if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === '23505') {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Resource already exists",
      cause: error,
    });
  }

  // Handle foreign key violations
  if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === '23503') {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Referenced resource not found",
      cause: error,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected database error occurred",
    cause: error,
  });
}

export function handleTRPCError(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: "Validation failed",
      cause: error,
    });
  }

  if (error instanceof AppError) {
    return new TRPCError({
      code: error.code,
      message: error.message,
      cause: error.cause,
    });
  }

  console.error("[Unhandled Error]", error);
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
    cause: error,
  });
}
