import { useState } from "react";
import { BookForm } from "../components/BookForm";
import { ConfirmBookDeletion } from "../components/ConfirmBookDeletion";
import { parseBookFilters, type BookFormValues } from "../schemas/book.schema";
import {
  useCreateBookMutation,
  useDeleteBookMutation,
  useGetBooksQuery,
  useUpdateBookMutation,
} from "../store/api";
import type { Book } from "../types/book";

const filters = parseBookFilters(new URLSearchParams("limit=50"));

function errorMessage(error: unknown, fallback: string) {
  const detail = error as {
    status?: number;
    data?: { error?: { message?: string } };
  };
  if (detail?.status === 409) return "A book with that ISBN already exists.";
  return detail?.data?.error?.message ?? fallback;
}

export function Admin() {
  const [editing, setEditing] = useState<Book>();
  const [creating, setCreating] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<Book>();
  const { currentData, isFetching, isError } = useGetBooksQuery(filters);
  const [createBook] = useCreateBookMutation();
  const [updateBook] = useUpdateBookMutation();
  const [deleteBook] = useDeleteBookMutation();
  const books = currentData?.data ?? [];

  async function save(values: BookFormValues) {
    if (editing) {
      const result = await updateBook({ id: editing.id, data: values });
      if ("error" in result) return errorMessage(result.error, "Could not update the book.");
      setEditing(undefined);
      return undefined;
    }
    const result = await createBook(values);
    if ("error" in result) return errorMessage(result.error, "Could not add the book.");
    setCreating(false);
    return undefined;
  }

  async function remove(book: Book) {
    const result = await deleteBook(book.id);
    return "error" in result ? result.error?.message || "Could not delete the book." : undefined;
  }

  const panelOpen = creating || !!editing;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Curator desk</p>
          <h1 className="font-display text-4xl font-semibold text-accent">
            Manage books
          </h1>
          <p className="mt-2 text-ink/70">Add, edit, and remove titles from the catalog.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(undefined);
            setCreating(true);
          }}
          type="button"
        >
          Add book
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
        <section className="surface overflow-hidden" aria-label="Book list">
          {isFetching && <p className="p-5" role="status">Loading books…</p>}
          {isError && (
            <p className="p-5" role="alert">Could not load books. Try again.</p>
          )}
          {!isFetching && !isError && books.length === 0 && (
            <div className="p-8 text-center">
              <p className="font-display text-2xl">The shelves are empty.</p>
              <p className="mt-2 text-ink/70">Start with the first title.</p>
            </div>
          )}
          {books.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink/10 bg-paper/60 text-ink/60">
                  <tr>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Author</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr className="border-b border-ink/5 last:border-0" key={book.id}>
                      <td className="px-5 py-4">
                        <span className="font-semibold">{book.title}</span>
                        <span className="block text-ink/60">{book.genre} · {book.publishedYear}</span>
                      </td>
                      <td className="px-5 py-4">{book.author}</td>
                      <td className="px-5 py-4">
                        <span className={book.available ? "chip chip-available" : "chip"}>
                          {book.available ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            className="btn-quiet"
                            onClick={() => {
                              setCreating(false);
                              setEditing(book);
                            }}
                            type="button"
                          >
                            Edit {book.title}
                          </button>
                          <button
                            className="btn-quiet btn-danger"
                            onClick={() => setPendingDeletion(book)}
                            type="button"
                          >
                            Delete {book.title}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="surface p-6" aria-label={panelOpen ? "Book editor" : "Book help"}>
          {panelOpen ? (
            <>
              <h2 className="font-display text-2xl">
                {editing ? `Edit ${editing.title}` : "Add a book"}
              </h2>
              <div className="mt-5">
                <BookForm
                  initial={editing}
                  submitLabel={editing ? "Save changes" : "Add book"}
                  onSubmit={save}
                  onCancel={() => {
                    setEditing(undefined);
                    setCreating(false);
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl">A tidy catalog</h2>
              <p className="mt-3 text-ink/70">
                Choose a title to edit it, or add a new one. Changes appear in the public catalog right away.
              </p>
            </>
          )}
        </aside>
      </div>
      {pendingDeletion && (
        <ConfirmBookDeletion
          book={pendingDeletion}
          onClose={() => setPendingDeletion(undefined)}
          onConfirm={() => remove(pendingDeletion)}
        />
      )}
    </>
  );
}
