import { Link, useSearchParams } from "react-router-dom";
import { BookCard } from "../components/BookCard";
import { useSession } from "../lib/auth-client";
import { parseBookFilters, sortFields } from "../schemas/book.schema";
import { useGetBooksQuery } from "../store/api";
import { isAdmin } from "../types/auth";

const sortLabels = {
  addedAt: "Date added",
  createdAt: "Creation date",
  updatedAt: "Last update",
  title: "Title",
  author: "Author",
  genre: "Genre",
  publishedYear: "Publication year",
  isbn: "ISBN",
  available: "Availability",
};

export function Home() {
  const [params, setParams] = useSearchParams();
  const filters = parseBookFilters(params);
  const { data: session } = useSession();
  const canManage = isAdmin(session?.user?.role);
  const { currentData, isFetching, isError, refetch } =
    useGetBooksQuery(filters);

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (name !== "page") next.delete("page");
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: name === "search" || name === "genre" });
  }

  return (
    <>
      <section className="grid gap-8 pb-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow">The reading room</p>
          <h1 className="font-display mt-3 text-5xl font-semibold text-accent sm:text-6xl">
            Library
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/70">
            Browse a curated shelf, find a title by author or genre, and see what is ready to borrow.
          </p>
        </div>
        <div className="surface flex items-center gap-5 p-6">
          <div>
            <p className="font-display text-4xl text-accent">
              {currentData?.meta.total ?? "—"}
            </p>
            <p className="text-sm text-ink/60">titles on the shelf</p>
          </div>
          <div className="h-12 w-px bg-ink/10" />
          <div>
            <p className="font-display text-4xl text-accent">24/7</p>
            <p className="text-sm text-ink/60">open catalog</p>
          </div>
        </div>
      </section>

      <form
        aria-label="Catalog filters"
        className="surface mb-8 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="grid gap-1 sm:col-span-2 lg:col-span-3">
          <span className="eyebrow">Search books</span>
          <input
            className="field text-lg"
            type="search"
            maxLength={120}
            placeholder="Title, author, or ISBN…"
            value={params.get("search")?.slice(0, 120) ?? ""}
            onChange={(event) => setFilter("search", event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Genre
          <input
            className="field"
            maxLength={60}
            placeholder="Fiction, History…"
            value={params.get("genre")?.slice(0, 60) ?? ""}
            onChange={(event) => setFilter("genre", event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Availability
          <select
            className="field"
            value={filters.available ?? ""}
            onChange={(event) => setFilter("available", event.target.value)}
          >
            <option value="">All books</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Sort by
          <select
            className="field"
            value={filters.sortBy}
            onChange={(event) => setFilter("sortBy", event.target.value)}
          >
            {sortFields.map((value) => (
              <option value={value} key={value}>
                {sortLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Sort order
          <select
            className="field"
            value={filters.sortOrder}
            onChange={(event) => setFilter("sortOrder", event.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Books per page
          <select
            className="field"
            value={filters.limit}
            onChange={(event) => setFilter("limit", event.target.value)}
          >
            {[...new Set([5, 10, 20, 50, filters.limit])]
              .sort((a, b) => a - b)
              .map((limit) => (
                <option key={limit}>{limit}</option>
              ))}
          </select>
        </label>
      </form>

      {isFetching && <p role="status">Loading books…</p>}
      {isError && (
        <div role="alert">
          Could not load books.{" "}
          <button className="underline" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      )}
      {currentData && (
        <>
          {currentData.data.length === 0 ? (
            <div className="surface p-10 text-center">
              <p className="font-display text-2xl">No books found.</p>
              <p className="mt-2 text-ink/70">
                Try a different search, or come back soon.
              </p>
              {canManage && (
                <Link className="btn-primary mt-5" to="/admin">
                  Add the first book
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {currentData.data.map((book) => (
                <li key={book.id}>
                  <BookCard book={book} />
                </li>
              ))}
            </ul>
          )}
          {(filters.page > 1 || currentData.meta.totalPages > 1) && (
            <nav
              aria-label="Pagination"
              className="mt-8 flex items-center justify-center gap-4"
            >
              <button
                type="button"
                className="btn-secondary disabled:opacity-50"
                disabled={filters.page <= 1}
                onClick={() => setFilter("page", String(filters.page - 1))}
              >
                Previous page
              </button>
              <span className="text-sm text-ink/70">Page {filters.page}</span>
              <button
                type="button"
                className="btn-secondary disabled:opacity-50"
                disabled={filters.page >= currentData.meta.totalPages}
                onClick={() => setFilter("page", String(filters.page + 1))}
              >
                Next page
              </button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
