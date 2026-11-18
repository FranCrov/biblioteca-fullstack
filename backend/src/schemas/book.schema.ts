import { z } from "zod";

const currentYear = new Date().getFullYear();

const bookFields = {
  title: z.string().trim().min(1).max(120),
  author: z.string().trim().min(1).max(120),
  genre: z.string().trim().min(1).max(60),
  publishedYear: z
    .number()
    .int()
    .min(1450)
    .max(currentYear + 1),
  isbn: z.string().regex(/^(?:\d{10}|\d{13})$/),
  available: z.boolean(),
};

export const createBookSchema = z.strictObject({
  ...bookFields,
  available: z.boolean().default(true),
});

export const updateBookSchema = z
  .strictObject(bookFields)
  .partial()
  .refine((book) => Object.keys(book).length > 0, {
    message: "At least one field is required",
  });

const sortFields = [
  "title",
  "author",
  "genre",
  "publishedYear",
  "isbn",
  "available",
  "addedAt",
  "createdAt",
  "updatedAt",
] as const;

export const listBooksQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  available: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  search: z.string().trim().min(1).max(120).optional(),
  genre: z.string().trim().min(1).max(60).optional(),
  sortBy: z.enum(sortFields).default("addedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type ListBooksQuery = z.infer<typeof listBooksQuerySchema>;
