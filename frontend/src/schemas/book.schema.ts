import { z } from "zod";

export const sortFields = [
  "addedAt",
  "createdAt",
  "updatedAt",
  "title",
  "author",
  "genre",
  "publishedYear",
  "isbn",
  "available",
] as const;

export const bookFiltersSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .max(Number.MAX_SAFE_INTEGER)
    .catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(10),
  search: z.string().trim().max(120).optional().catch(undefined),
  genre: z.string().trim().max(60).optional().catch(undefined),
  available: z.enum(["true", "false"]).optional().catch(undefined),
  sortBy: z.enum(sortFields).catch("addedAt"),
  sortOrder: z.enum(["asc", "desc"]).catch("desc"),
});

export type BookFilters = z.infer<typeof bookFiltersSchema>;

export function parseBookFilters(params: URLSearchParams): BookFilters {
  const parsed = bookFiltersSchema.parse(Object.fromEntries(params));
  return {
    ...parsed,
    search: parsed.search || undefined,
    genre: parsed.genre || undefined,
  };
}

const currentYear = new Date().getFullYear();

export const bookFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120),
  author: z.string().trim().min(1, "Author is required.").max(120),
  genre: z.string().trim().min(1, "Genre is required.").max(60),
  publishedYear: z
    .number({ error: "Enter a publication year." })
    .int("Use a whole year.")
    .min(1450, "Year must be 1450 or later.")
    .max(currentYear + 1, `Year cannot be after ${currentYear + 1}.`),
  isbn: z
    .string()
    .trim()
    .regex(/^(?:\d{10}|\d{13})$/, "Use a 10- or 13-digit ISBN."),
  available: z.boolean(),
});

export type BookFormValues = z.infer<typeof bookFormSchema>;
