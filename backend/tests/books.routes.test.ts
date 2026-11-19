import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/books.service.js", () => ({
  listBooks: vi.fn(), getBookById: vi.fn(), createBook: vi.fn(),
  updateBook: vi.fn(), deleteBook: vi.fn(),
}));
vi.mock("../src/lib/auth.js", () => ({
  getAuth: () => ({ api: { getSession: async ({ headers }: { headers: Headers }) => {
    const role = headers.get("x-test-role");
    return role ? { user: { id: "1", email: "test@example.com", role } } : null;
  } } }),
}));

import * as books from "../src/services/books.service.js";
import { ApiError } from "../src/lib/api-error.js";
import { booksRouter } from "../src/routes/books.routes.js";
import { errorMiddleware } from "../src/middlewares/error.middleware.js";

const app = express();
app.use(express.json());
app.use("/api/v1/books", booksRouter);
app.use(errorMiddleware);
const book = { title: "Book", author: "Author", genre: "Fiction", publishedYear: 2020, isbn: "1234567890", available: true };

beforeEach(() => vi.resetAllMocks());

describe("books HTTP API", () => {
  it("reports malformed JSON as a client error", async () => {
    const response = await request(app).post("/api/v1/books").set("Content-Type", "application/json").send("{");
    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Invalid JSON");
  });
  it("lists books and validates query parameters", async () => {
    vi.mocked(books.listBooks).mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } });
    expect((await request(app).get("/api/v1/books").query({ search: "a+b(c)" })).status).toBe(200);
    expect(books.listBooks).toHaveBeenCalledWith(expect.objectContaining({ search: "a+b(c)" }));
    expect((await request(app).get("/api/v1/books?page=0")).status).toBe(400);
  });
  it("requires an admin for writes", async () => {
    expect((await request(app).post("/api/v1/books").send(book)).status).toBe(401);
    expect((await request(app).post("/api/v1/books").set("x-test-role", "user").send(book)).status).toBe(403);
    vi.mocked(books.createBook).mockResolvedValue({ id: "1", ...book } as never);
    const response = await request(app).post("/api/v1/books").set("x-test-role", "admin").send(book);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: "1", title: "Book" });
  });
  it("handles missing books, invalid input, updates and deletion", async () => {
    vi.mocked(books.getBookById).mockRejectedValue(new ApiError(404, "Book not found"));
    expect((await request(app).get("/api/v1/books/000000000000000000000000")).status).toBe(404);
    const invalid = await request(app).put("/api/v1/books/1").set("x-test-role", "admin").send({ publishedYear: "no" });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details).toBeDefined();
    vi.mocked(books.updateBook).mockResolvedValue({ id: "1", ...book } as never);
    expect((await request(app).put("/api/v1/books/1").set("x-test-role", "admin").send({ title: "Changed" })).status).toBe(200);
    const deleted = await request(app).delete("/api/v1/books/1").set("x-test-role", "admin");
    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe("");
  });
});
