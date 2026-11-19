import { skipToken } from "@reduxjs/toolkit/query";
import { Link, useParams } from "react-router-dom";
import { Availability } from "../components/BookCard";
import { useGetBookByIdQuery } from "../store/api";

export function BookDetail() {
  const { id } = useParams();
  const {
    currentData: book,
    error,
    isFetching,
  } = useGetBookByIdQuery(id ?? skipToken);
  const missing = !!error && "status" in error && error.status === 404;

  return (
    <>
      <Link to="/" className="btn-secondary inline-flex text-sm">
        Back to catalog
      </Link>
      <div className="surface mt-8 grid gap-8 p-8 md:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow">Book details</p>
          <h1 className="font-display mt-3 text-4xl font-semibold text-accent sm:text-5xl">
            {book?.title ?? (missing ? "Book not found" : "Book details")}
          </h1>
          {isFetching && <p role="status">Loading book…</p>}
          {error && !missing && <p role="alert">Could not load this book.</p>}
          {book && (
            <>
              <p className="mt-3 text-xl text-ink/70">{book.author}</p>
              <dl className="mt-8 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3 border-t border-ink/10 pt-6">
                <dt className="text-ink/55">Genre</dt>
                <dd>{book.genre}</dd>
                <dt className="text-ink/55">Year</dt>
                <dd>{book.publishedYear}</dd>
                <dt className="text-ink/55">ISBN</dt>
                <dd>{book.isbn}</dd>
                <dt className="text-ink/55">Status</dt>
                <dd>
                  <Availability available={book.available} />
                </dd>
              </dl>
            </>
          )}
        </div>
        <div className="hidden h-40 w-32 self-start rounded-lg bg-gradient-to-br from-accent/20 via-gold/20 to-accent/5 md:block" />
      </div>
    </>
  );
}
