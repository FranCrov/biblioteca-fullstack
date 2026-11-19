import { Link } from "react-router-dom";
import type { Book } from "../types/book";

export function Availability({ available }: { available: boolean }) {
  return (
    <span
      className={
        available
          ? "rounded-full bg-emerald-100 px-2 py-1 text-emerald-900"
          : "rounded-full bg-amber-100 px-2 py-1 text-amber-900"
      }
    >
      {available ? "Available" : "Unavailable"}
    </span>
  );
}

export function BookCard({ book }: { book: Book }) {
  return (
    <article className="h-full rounded-lg border border-ink/20 p-4">
      <h2 className="text-xl font-semibold">
        <Link
          className="text-accent underline"
          to={`/books/${encodeURIComponent(book.id)}`}
        >
          {book.title}
        </Link>
      </h2>
      <p>{book.author}</p>
      <p className="mt-2 text-sm">
        {book.genre} · {book.publishedYear}
      </p>
      <p className="mb-3 text-sm">ISBN {book.isbn}</p>
      <Availability available={book.available} />
    </article>
  );
}
