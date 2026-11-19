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
      <Link to="/" className="text-accent underline">
        Back to catalog
      </Link>
      <h1 className="mt-4 text-4xl font-bold">
        {book?.title ?? (missing ? "Book not found" : "Book details")}
      </h1>
      {isFetching && <p role="status">Loading book…</p>}
      {error && !missing && <p role="alert">Could not load this book.</p>}
      {book && (
        <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-5 gap-y-2">
          <dt>Author</dt>
          <dd>{book.author}</dd>
          <dt>Genre</dt>
          <dd>{book.genre}</dd>
          <dt>Year</dt>
          <dd>{book.publishedYear}</dd>
          <dt>ISBN</dt>
          <dd>{book.isbn}</dd>
          <dt>Status</dt>
          <dd>
            <Availability available={book.available} />
          </dd>
        </dl>
      )}
    </>
  );
}
