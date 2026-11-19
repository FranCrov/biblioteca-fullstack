import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { bookFormSchema, type BookFormValues } from "../schemas/book.schema";
import type { Book } from "../types/book";

type Props = {
  initial?: Book;
  submitLabel: string;
  onSubmit: (values: BookFormValues) => Promise<string | undefined>;
  onCancel?: () => void;
};

function defaults(initial?: Book): BookFormValues {
  return {
    title: initial?.title ?? "",
    author: initial?.author ?? "",
    genre: initial?.genre ?? "",
    publishedYear: initial?.publishedYear ?? new Date().getFullYear(),
    isbn: initial?.isbn ?? "",
    available: initial?.available ?? true,
  };
}

export function BookForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: defaults(initial),
  });

  useEffect(() => {
    reset(defaults(initial));
    setServerError(undefined);
  }, [initial, reset]);

  async function save(values: BookFormValues) {
    setServerError(undefined);
    const error = await onSubmit(values);
    if (error) setServerError(error);
    else if (!initial) reset(defaults());
  }

  const field = "field";

  return (
    <form
      aria-label={submitLabel}
      className="grid gap-4"
      noValidate
      onSubmit={handleSubmit(save)}
    >
      <div className="grid gap-1">
        <label htmlFor="book-title">Title</label>
        <input id="book-title" className={field} {...register("title")} />
        {errors.title && <p role="alert">{errors.title.message}</p>}
      </div>
      <div className="grid gap-1">
        <label htmlFor="book-author">Author</label>
        <input id="book-author" className={field} {...register("author")} />
        {errors.author && <p role="alert">{errors.author.message}</p>}
      </div>
      <div className="grid gap-1">
        <label htmlFor="book-genre">Genre</label>
        <input id="book-genre" className={field} {...register("genre")} />
        {errors.genre && <p role="alert">{errors.genre.message}</p>}
      </div>
      <div className="grid gap-1">
        <label htmlFor="book-year">Publication year</label>
        <input
          id="book-year"
          className={field}
          inputMode="numeric"
          {...register("publishedYear", { valueAsNumber: true })}
        />
        {errors.publishedYear && (
          <p role="alert">{errors.publishedYear.message}</p>
        )}
      </div>
      <div className="grid gap-1">
        <label htmlFor="book-isbn">ISBN</label>
        <input
          id="book-isbn"
          className={field}
          inputMode="numeric"
          readOnly={!!initial}
          {...register("isbn")}
        />
        {errors.isbn && <p role="alert">{errors.isbn.message}</p>}
      </div>
      <label className="flex items-center gap-2" htmlFor="book-available">
        <input
          id="book-available"
          type="checkbox"
          {...register("available")}
        />
        Available to borrow
      </label>
      {serverError && <p role="alert">{serverError}</p>}
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            className="btn-secondary"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
