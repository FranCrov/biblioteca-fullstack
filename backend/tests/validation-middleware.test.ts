import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError } from "../src/lib/api-error.js";
import { validateBody, validateQuery } from "../src/middlewares/validate.js";

describe("validation middleware", () => {
  it("stores parsed body data and forwards clear 400 details for invalid input", () => {
    const schema = z.strictObject({ title: z.string().min(1) });
    const req = { body: { title: "  Book  " } } as never;
    const next = vi.fn();

    validateBody(schema)(req, {} as never, next);
    expect(req.body).toEqual({ title: "  Book  " });

    req.body = { title: "" };
    validateBody(schema)(req, {} as never, next);
    expect(next.mock.calls.at(-1)?.[0]).toBeInstanceOf(ApiError);
    expect(next.mock.calls.at(-1)?.[0]).toMatchObject({
      status: 400,
      details: [{ path: ["title"] }],
    });
  });

  it("stores coerced query data in response locals without replacing Express 5 req.query", () => {
    const req = { query: { page: "2" } } as never;
    const res = { locals: {} } as never;
    const next = vi.fn();

    validateQuery(z.strictObject({ page: z.coerce.number().int() }))(
      req,
      res,
      next,
    );

    expect(res.locals.validatedQuery).toEqual({ page: 2 });
    expect(next).toHaveBeenCalledWith();
  });
});
