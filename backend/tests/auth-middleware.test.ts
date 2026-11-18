import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
vi.mock("../src/lib/auth.js", () => ({
  getAuth: () => ({ api: { getSession } }),
}));

import {
  authMiddleware,
  isAdmin,
  requireRole,
} from "../src/middlewares/auth.middleware.js";
import { ApiError } from "../src/lib/api-error.js";

function response() {
  return { locals: {} } as never;
}

describe("auth middleware", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects requests without a session with 401", async () => {
    getSession.mockResolvedValue(null);
    const next = vi.fn();

    await authMiddleware({ headers: {} } as never, response(), next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });

  it("attaches the session user and gives missing roles the user default", async () => {
    getSession.mockResolvedValue({
      user: { id: "u1", email: "reader@example.test" },
    });
    const req = { headers: {}, user: undefined } as never;
    const next = vi.fn();

    await authMiddleware(req, response(), next);

    expect(req.user).toEqual({
      id: "u1",
      email: "reader@example.test",
      role: "user",
    });
    expect(next).toHaveBeenCalledWith();
  });

  it("requires an allowed role and identifies admins in one helper", () => {
    const noUser = { user: undefined } as never;
    const user = {
      user: { id: "u1", email: "reader@example.test", role: "user" },
    } as never;
    const admin = {
      user: { id: "a1", email: "admin@example.test", role: "admin" },
    } as never;
    const forbiddenNext = vi.fn();
    const allowedNext = vi.fn();

    requireRole("admin")(noUser, response(), forbiddenNext);
    requireRole("admin")(user, response(), forbiddenNext);
    requireRole("admin")(admin, response(), allowedNext);

    expect(forbiddenNext.mock.calls.map(([error]) => error.status)).toEqual([
      401, 403,
    ]);
    expect(allowedNext).toHaveBeenCalledWith();
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("user")).toBe(false);
  });
});
