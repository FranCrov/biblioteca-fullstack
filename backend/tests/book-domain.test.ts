import { describe, expect, it } from "vitest";
import { Book } from "../src/models/Book.js";
import {
  createBookSchema,
  listBooksQuerySchema,
  updateBookSchema,
} from "../src/schemas/book.schema.js";
import { ApiError } from "../src/lib/api-error.js";
import { escapeRegex } from "../src/lib/escape-regex.js";
import { isDuplicateKeyError } from "../src/lib/is-duplicate-key-error.js";

const validBook = {
  title: "The Left Hand of Darkness",
  author: "Ursula K. Le Guin",
  genre: "Science Fiction",
  publishedYear: 1969,
  isbn: "0306406152",
};

describe("createBookSchema", () => {
  it("accepts a valid book and defaults availability to true", () => {
    expect(createBookSchema.parse(validBook)).toEqual({
      ...validBook,
      available: true,
    });
  });

  it("rejects missing required fields and out-of-range values", () => {
    expect(
      createBookSchema.safeParse({ ...validBook, title: "" }).success,
    ).toBe(false);
    expect(
      createBookSchema.safeParse({
        ...validBook,
        publishedYear: new Date().getFullYear() + 2,
      }).success,
    ).toBe(false);
    expect(
      createBookSchema.safeParse({ ...validBook, isbn: "123" }).success,
    ).toBe(false);
  });

  it("rejects fields that the API does not allow clients to set", () => {
    expect(
      createBookSchema.safeParse({ ...validBook, addedAt: new Date() }).success,
    ).toBe(false);
  });
});

describe("updateBookSchema", () => {
  it("accepts a partial update with at least one valid field", () => {
    expect(updateBookSchema.parse({ title: "A Wizard of Earthsea" })).toEqual({
      title: "A Wizard of Earthsea",
    });
  });

  it("rejects an empty update and invalid values", () => {
    expect(updateBookSchema.safeParse({}).success).toBe(false);
    expect(updateBookSchema.safeParse({ available: "false" }).success).toBe(
      false,
    );
  });
});

describe("listBooksQuerySchema", () => {
  it("coerces pagination values and parses the false availability filter correctly", () => {
    expect(
      listBooksQuerySchema.parse({ page: "2", limit: "5", available: "false" }),
    ).toMatchObject({
      page: 2,
      limit: 5,
      available: false,
    });
  });

  it("rejects invalid booleans, ranges, and sort fields", () => {
    expect(listBooksQuerySchema.safeParse({ available: "no" }).success).toBe(
      false,
    );
    expect(listBooksQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(listBooksQuerySchema.safeParse({ sortBy: "password" }).success).toBe(
      false,
    );
  });
});

describe("Book model", () => {
  it("defaults availability and serializes the id without __v", () => {
    const book = new Book(validBook);
    const json = book.toJSON();

    expect(book.available).toBe(true);
    expect(book.addedAt).toBeInstanceOf(Date);
    expect(json.id).toBe(String(book._id));
    expect(json).not.toHaveProperty("_id");
    expect(json).not.toHaveProperty("__v");
  });
});

describe("shared domain helpers", () => {
  it("escapes regex metacharacters in search text", () => {
    expect(escapeRegex("a+b(c)")).toBe("a\\+b\\(c\\)");
  });

  it("identifies Mongo duplicate key errors", () => {
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true);
    expect(isDuplicateKeyError({ code: 11001 })).toBe(false);
    expect(isDuplicateKeyError(new Error("duplicate"))).toBe(false);
  });

  it("preserves status, message, and optional details in ApiError", () => {
    const error = new ApiError(409, "ISBN already exists", [
      { path: ["isbn"], message: "Duplicate" },
    ]);

    expect(error.status).toBe(409);
    expect(error.message).toBe("ISBN already exists");
    expect(error.details).toEqual([{ path: ["isbn"], message: "Duplicate" }]);
  });
});
