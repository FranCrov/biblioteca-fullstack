import { useSearchParams } from "react-router-dom";
import { BookCard } from "../components/BookCard";
import { parseBookFilters, sortFields } from "../schemas/book.schema";
import { useGetBooksQuery } from "../store/api";

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
const field = "rounded border border-ink/30 bg-white px-2 py-1";

export function Home() {
  const [params, setParams] = useSearchParams();
  const filters = parseBookFilters(params);
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
      <h1 className="text-4xl font-bold text-accent">Library</h1>
      <form
        aria-label="Catalog filters"
        className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="grid gap-1">
          Search books
          <input
            className={field}
            type="search"
            maxLength={120}
            value={params.get("search")?.slice(0, 120) ?? ""}
            onChange={(event) => setFilter("search", event.target.value)}
          />
        </label>
        <label className="grid gap-1">
          Genre
          <input
            className={field}
            maxLength={60}
            value={params.get("genre")?.slice(0, 60) ?? ""}
            onChange={(event) => setFilter("genre", event.target.value)}
          />
        </label>
        <label className="grid gap-1">
          Availability
          <select
            className={field}
            value={filters.available ?? ""}
            onChange={(event) => setFilter("available", event.target.value)}
          >
            <option value="">All books</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </label>
        <label className="grid gap-1">
          Sort by
          <select
            className={field}
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
        <label className="grid gap-1">
          Sort order
          <select
            className={field}
            value={filters.sortOrder}
            onChange={(event) => setFilter("sortOrder", event.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
        <label className="grid gap-1">
          Books per page
          <select
            className={field}
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
            <p>No books found.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              className="mt-6 flex items-center gap-4"
            >
              <button
                type="button"
                className="underline disabled:opacity-60"
                disabled={filters.page <= 1}
                onClick={() => setFilter("page", String(filters.page - 1))}
              >
                Previous page
              </button>
              <span>Page {filters.page}</span>
              <button
                type="button"
                className="underline disabled:opacity-60"
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
