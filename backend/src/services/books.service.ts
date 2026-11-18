import { Types } from "mongoose";
import { Book } from "../models/Book.js";
import { ApiError } from "../lib/api-error.js";
import { escapeRegex } from "../lib/escape-regex.js";
import { isDuplicateKeyError } from "../lib/is-duplicate-key-error.js";
import type {
  CreateBookInput,
  ListBooksQuery,
  UpdateBookInput,
} from "../schemas/book.schema.js";
import type { PaginatedResult } from "../types/pagination.types.js";
import type { BookDocument } from "../models/Book.js";

function validateId(id: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid book id");
  }
}

function translateDuplicateError(error: unknown): never {
  if (isDuplicateKeyError(error)) {
    throw new ApiError(409, "A book with this ISBN already exists");
  }
  throw error;
}

export async function listBooks(
  query: ListBooksQuery,
): Promise<PaginatedResult<BookDocument>> {
  const filter: Record<string, unknown> = {};

  if (query.available !== undefined) filter.available = query.available;
  if (query.genre) filter.genre = query.genre;
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ title: pattern }, { author: pattern }, { genre: pattern }];
  }

  const direction = query.sortOrder === "asc" ? 1 : -1;
  const [data, total] = await Promise.all([
    Book.find(filter)
      .sort({ [query.sortBy]: direction })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Book.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getBookById(id: string): Promise<BookDocument> {
  validateId(id);
  const book = await Book.findById(id);
  if (!book) throw new ApiError(404, "Book not found");
  return book;
}

export async function createBook(
  input: CreateBookInput,
): Promise<BookDocument> {
  try {
    return await Book.create(input);
  } catch (error) {
    return translateDuplicateError(error);
  }
}

export async function updateBook(
  id: string,
  input: UpdateBookInput,
): Promise<BookDocument> {
  validateId(id);
  try {
    const book = await Book.findByIdAndUpdate(id, input, {
      new: true,
      runValidators: true,
    });
    if (!book) throw new ApiError(404, "Book not found");
    return book;
  } catch (error) {
    return translateDuplicateError(error);
  }
}

export async function deleteBook(id: string): Promise<void> {
  validateId(id);
  const book = await Book.findByIdAndDelete(id);
  if (!book) throw new ApiError(404, "Book not found");
}
