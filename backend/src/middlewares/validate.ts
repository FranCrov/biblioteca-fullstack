import type { RequestHandler } from "express";
import type { z } from "zod";
import { ApiError } from "../lib/api-error.js";

function validationError(error: z.ZodError): ApiError {
  return new ApiError(
    400,
    "Validation failed",
    error.issues.map((issue) => ({
      path: issue.path.map((part) =>
        typeof part === "number" ? part : String(part),
      ),
      message: issue.message,
    })),
  );
}

export function validateBody<T extends z.ZodType>(schema: T): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(validationError(result.error));
    req.body = result.data;
    return next();
  };
}

export function validateQuery<T extends z.ZodType>(schema: T): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return next(validationError(result.error));
    res.locals.validatedQuery = result.data;
    return next();
  };
}
