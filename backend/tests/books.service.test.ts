import { beforeEach, describe, expect, it, vi } from "vitest";

const model = vi.hoisted(() => ({
  find: vi.fn(),
  countDocuments: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
}));

vi.mock("../src/models/Book.js", () => ({ Book: model }));

import { ApiError } from "../src/lib/api-error.js";
import {
  createBook,
  deleteBook,
  getBookById,
  listBooks,
  updateBook,
} from "../src/services/books.service.js";

const book = { _id: "507f1f77bcf86cd799439011", title: "Dune" };

function createListQuery(result: unknown[]) {
  const query = {
    sort: vi.fn(),
    skip: vi.fn(),
    limit: vi.fn(),
  };
  query.sort.mockReturnValue(query);
  query.skip.mockReturnValue(query);
  query.limit.mockResolvedValue(result);
  model.find.mockReturnValue(query);
  return query;
}

describe("books service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists filtered books with pagination metadata", async () => {
    const query = createListQuery([book]);
    model.countDocuments.mockResolvedValue(11);

    const result = await listBooks({
      page: 2,
      limit: 5,
      available: false,
      sortBy: "title",
      sortOrder: "asc",
    });

    expect(model.find).toHaveBeenCalledWith({ available: false });
    expect(query.sort).toHaveBeenCalledWith({ title: 1 });
    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(result).toEqual({
      data: [book],
      meta: { total: 11, page: 2, limit: 5, totalPages: 3 },
    });
  });

  it("escapes search text before building the Mongo filter", async () => {
    createListQuery([]);
    model.countDocuments.mockResolvedValue(0);

    await listBooks({ page: 1, limit: 10, search: "a+b(c)" });

    const filter = model.find.mock.calls[0][0];
    expect(filter.$or[0].title.source).toContain("a\\+b\\(c\\)");
  });

  it("returns a book by a valid id", async () => {
    model.findById.mockResolvedValue(book);

    await expect(getBookById(book._id)).resolves.toBe(book);
  });

  it("rejects malformed ids before querying and reports missing books as 404", async () => {
    await expect(getBookById("no-es-un-id")).rejects.toMatchObject({
      status: 400,
    });
    expect(model.findById).not.toHaveBeenCalled();

    model.findById.mockResolvedValue(null);
    await expect(getBookById("507f1f77bcf86cd799439011")).rejects.toMatchObject(
      { status: 404 },
    );
  });

  it("creates books and maps duplicate ISBN errors to 409", async () => {
    model.create.mockResolvedValue(book);
    await expect(createBook({ title: "Dune" })).resolves.toBe(book);

    model.create.mockRejectedValue({ code: 11000 });
    await expect(createBook({ title: "Dune" })).rejects.toBeInstanceOf(
      ApiError,
    );
    await expect(createBook({ title: "Dune" })).rejects.toMatchObject({
      status: 409,
    });
  });

  it("updates existing books with validators and reports missing books as 404", async () => {
    model.findByIdAndUpdate.mockResolvedValue(book);
    await expect(
      updateBook("507f1f77bcf86cd799439011", { title: "Dune Messiah" }),
    ).resolves.toBe(book);
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      { title: "Dune Messiah" },
      { new: true, runValidators: true },
    );

    model.findByIdAndUpdate.mockResolvedValue(null);
    await expect(
      updateBook("507f1f77bcf86cd799439011", { title: "Missing" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("deletes existing books and reports missing books as 404", async () => {
    model.findByIdAndDelete.mockResolvedValue(book);
    await expect(
      deleteBook("507f1f77bcf86cd799439011"),
    ).resolves.toBeUndefined();

    model.findByIdAndDelete.mockResolvedValue(null);
    await expect(deleteBook("507f1f77bcf86cd799439011")).rejects.toMatchObject({
      status: 404,
    });
  });
});
