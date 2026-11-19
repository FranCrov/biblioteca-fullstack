import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiError } from "../lib/api-error.js";

export const notFound: RequestHandler = (_req, _res, next) => next(new ApiError(404, "Not found"));

export const errorMiddleware: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error && typeof error === "object" && "type" in error) {
    if (error.type === "entity.parse.failed") {
      res.status(400).json({ success: false, error: { message: "Invalid JSON" } });
      return;
    }
    if (error.type === "entity.too.large") {
      res.status(413).json({ success: false, error: { message: "Request body too large" } });
      return;
    }
  }
  const known = error instanceof ApiError;
  const status = known ? error.status : 500;
  const message = known ? error.message : "Internal server error";
  const details = known ? error.details : undefined;
  res.status(status).json({ success: false, error: { message, ...(details ? { details } : {}) } });
};
