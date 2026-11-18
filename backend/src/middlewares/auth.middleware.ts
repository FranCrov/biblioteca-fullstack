import { fromNodeHeaders } from "better-auth/node";
import type { RequestHandler } from "express";
import { ApiError } from "../lib/api-error.js";
import { getAuth } from "../lib/auth.js";
import type { UserRole } from "../types/auth.types.js";

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const session = await getAuth().api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) return next(new ApiError(401, "Authentication required"));

    const sessionUser = session.user as typeof session.user & { role?: string };

    req.user = {
      id: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role === "admin" ? "admin" : "user",
    };
    return next();
  } catch (error) {
    return next(error);
  }
};

export function isAdmin(role: string | undefined): boolean {
  return role === "admin";
}

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (!roles.includes(req.user.role))
      return next(new ApiError(403, "Insufficient permissions"));
    return next();
  };
}
