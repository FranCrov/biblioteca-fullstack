import { Link } from "react-router-dom";
import type { Book } from "../types/book";

export function Availability({ available }: { available: boolean }) {
  return (
    <span className={available ? "chip chip-available" : "chip"}>
      {available ? "Available" : "Unavailable"}
    </span>
  );
}

export function BookCard({ book }: { book: Book }) {
  return (
    <article className="surface group h-full overflow-hidden p-6 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-5 h-1.5 w-12 rounded-full bg-gold/70 transition group-hover:w-20" />
      <p className="eyebrow mb-2">{book.genre}</p>
      <h2 className="font-display text-2xl leading-tight">
        <Link
          className="text-accent decoration-gold/50 underline-offset-4 hover:underline"
          to={`/books/${encodeURIComponent(book.id)}`}
        >
          {book.title}
        </Link>
      </h2>
      <p className="mt-2 text-ink/80">{book.author}</p>
      <p className="mt-1 text-sm text-ink/55">{book.publishedYear}</p>
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
        <Availability available={book.available} />
        <span className="text-xs text-ink/45">ISBN {book.isbn}</span>
      </div>
    </article>
  );
}
