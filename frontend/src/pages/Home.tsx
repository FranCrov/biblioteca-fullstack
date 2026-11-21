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
  const hasFilters =
    Boolean(filters.search || filters.genre) || filters.available !== undefined;
  const { data: session } = useSession();
  const canManage = isAdmin(session?.user?.role);
  const { currentData, isFetching, isError, refetch } =
    useGetBooksQuery(filters);

  const total = currentData?.meta.total;

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (name !== "page") next.delete("page");
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: name === "search" || name === "genre" });
  }

  function clearFilters() {
    const next = new URLSearchParams(params);
    for (const key of ["search", "genre", "available", "page"])
      next.delete(key);
    setParams(next);
  }

  return (
    <>
      <section className="catalog-masthead mb-6 rounded-3xl px-6 py-10 text-paper sm:p-12">
        <div className="max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e5bd78]">
            The reading room
          </p>
          <h1 className="font-display mt-3 text-5xl font-semibold sm:text-7xl">
            Library
          </h1>
          <p className="mt-4 max-w-sm text-lg leading-relaxed text-paper/90">
            Find your next read by title, author, or genre. See what’s ready to
            borrow.
          </p>
        </div>
      </section>

      <form
        aria-label="Catalog filters"
        className="surface mb-8 grid min-w-0 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="grid gap-2 sm:col-span-2 lg:col-span-5">
          <span className="text-sm font-semibold text-accent">
            Search books
          </span>
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

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/15 pb-3">
        <h2 className="font-display text-3xl text-accent">
          {hasFilters ? "Search results" : "The collection"}
        </h2>
        {total !== undefined && !isError && (
          <p className="text-sm text-ink/70">
            {total} {total === 1 ? "title" : "titles"}
          </p>
        )}
      </div>
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
              <h3 className="font-display text-2xl">
                {total
                  ? "No books on this page"
                  : hasFilters
                    ? "No matching books"
                    : "The collection is empty"}
              </h3>
              <p className="mt-2 text-ink/70">
                {total
                  ? "Return to a page with books."
                  : hasFilters
                    ? "Try a different search or clear your filters."
                    : "New titles will appear here once they’re added."}
              </p>
              {hasFilters && (
                <button
                  className="btn-secondary mt-5"
                  type="button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
              {!hasFilters && total === 0 && canManage && (
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
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
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
