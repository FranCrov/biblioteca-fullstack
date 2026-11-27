import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import { Admin } from "./Admin";

const api = vi.hoisted(() => ({
  getBooks: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../store/api", () => ({
  useGetBooksQuery: () => api.getBooks(),
  useCreateBookMutation: () => [api.create],
  useUpdateBookMutation: () => [api.update],
  useDeleteBookMutation: () => [api.remove],
}));

const book = {
  id: "book-1",
  title: "Existing Book",
  author: "A. Writer",
  genre: "History",
  publishedYear: 2020,
  isbn: "1234567890",
  available: true,
  addedAt: "2026-01-01",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

function open(books: typeof book[] = []) {
  api.getBooks.mockReturnValue({
    currentData: { data: books },
    isFetching: false,
    isError: false,
  });
  api.create.mockResolvedValue({ data: book });
  api.update.mockResolvedValue({ data: book });
  api.remove.mockResolvedValue({ data: undefined });
  const router = createMemoryRouter([{ path: "/admin", element: <Admin /> }], {
    initialEntries: ["/admin"],
  });
  render(<RouterProvider router={router} />);
}

function fillBook(title: string) {
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: title } });
  fireEvent.change(screen.getByLabelText("Author"), { target: { value: "New Author" } });
  fireEvent.change(screen.getByLabelText("Genre"), { target: { value: "Fiction" } });
  fireEvent.change(screen.getByLabelText("Publication year"), { target: { value: "2024" } });
  fireEvent.change(screen.getByLabelText("ISBN"), { target: { value: "9781234567890" } });
}

test("shows an empty shelf and creates a book from the admin desk", async () => {
  open();
  expect(screen.getByText("The shelves are empty.")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Add book" }));
  fillBook("A New Book");
  fireEvent.submit(screen.getByRole("form", { name: "Add book" }));

  await waitFor(() => expect(api.create).toHaveBeenCalledTimes(1));
  expect(api.create.mock.calls[0][0]).toMatchObject({
    title: "A New Book",
    author: "New Author",
    genre: "Fiction",
    isbn: "9781234567890",
    available: true,
  });
});

test("translates a duplicate ISBN into a readable error", async () => {
  open();
  api.create.mockResolvedValue({ error: { status: 409 } });
  fireEvent.click(screen.getByRole("button", { name: "Add book" }));
  fillBook("Duplicate");
  fireEvent.submit(screen.getByRole("form", { name: "Add book" }));

  expect((await screen.findByRole("alert")).textContent).toBe(
    "A book with that ISBN already exists.",
  );
});

test("edits an existing title", async () => {
  open([book]);

  fireEvent.click(screen.getByRole("button", { name: `Edit ${book.title}` }));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Updated Book" } });
  fireEvent.submit(screen.getByRole("form", { name: "Save changes" }));
  await waitFor(() => expect(api.update).toHaveBeenCalledTimes(1));
  expect(api.update.mock.calls[0][0]).toMatchObject({
    id: book.id,
    data: { title: "Updated Book" },
  });
});

// jsdom does not implement the native modal lifecycle or keyboard dismissal.
HTMLDialogElement.prototype.showModal ??= function () { this.open = true; };
HTMLDialogElement.prototype.close ??= function () { this.open = false; };

function openDeleteDialog() {
  fireEvent.click(screen.getByRole("button", { name: `Delete ${book.title}` }));
  return screen.getByRole("dialog", { name: `Delete “${book.title}”?` });
}

test.each(["Cancel", "Escape"])("dismisses deletion with %s without sending a request", (action) => {
  open([book]);
  const dialog = openDeleteDialog();
  const cancel = within(dialog).getByRole("button", { name: "Cancel" });
  expect(document.activeElement).toBe(cancel);
  expect(dialog.textContent).toContain("This cannot be undone.");
  expect(api.remove).not.toHaveBeenCalled();

  if (action === "Escape") {
    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
  } else {
    fireEvent.click(cancel);
  }

  expect(screen.queryByRole("dialog")).toBeNull();
  expect(api.remove).not.toHaveBeenCalled();
  expect(screen.getByText(book.title)).toBeDefined();
});

test("confirms one permanent deletion and closes on success", async () => {
  open([book]);
  let complete!: () => void;
  api.remove.mockReturnValue(new Promise((resolve) => {
    complete = () => resolve({ data: undefined });
  }));
  const dialog = openDeleteDialog();
  const confirm = within(dialog).getByRole("button", { name: "Delete permanently" });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));

  expect(api.remove).toHaveBeenCalledExactlyOnceWith(book.id);
  expect(within(dialog).getByRole("status").textContent).toBe("Deleting…");
  expect(screen.getByRole("dialog")).toBe(dialog);

  complete();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

test("keeps a failed deletion open and allows a retry", async () => {
  open([book]);
  api.remove.mockResolvedValueOnce({ error: { status: 500, message: "Deletion failed." } });
  const dialog = openDeleteDialog();
  const confirm = within(dialog).getByRole("button", { name: "Delete permanently" });
  fireEvent.click(confirm);

  expect((await within(dialog).findByRole("alert")).textContent).toBe("Deletion failed.");
  expect(screen.getByText(book.title)).toBeDefined();
  fireEvent.click(confirm);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(api.remove).toHaveBeenCalledTimes(2);
});

// S3: duplicate display titles must not collapse record identity.
test("confirms only the second record when two books have the same title", async () => {
  const other = { ...book, id: "book-2", author: "Other Writer", isbn: "9876543210" };
  open([book, other]);
  const row = screen.getByRole("row", { name: /Other Writer/ });
  fireEvent.click(within(row).getByRole("button", { name: `Delete ${book.title}` }));
  const dialog = screen.getByRole("dialog", { name: `Delete “${book.title}”?` });
  expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
  expect(dialog.textContent).toContain(`ISBN ${other.isbn}`);
  expect(api.remove).not.toHaveBeenCalled();
  api.remove.mockResolvedValueOnce({ error: { status: 500, message: "Fixture deletion failed." } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Delete permanently" }));
  expect((await within(dialog).findByRole("alert")).textContent).toBe("Fixture deletion failed.");
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("row", { name: /Other Writer/ })).toBe(row);
  expect(api.remove).toHaveBeenCalledExactlyOnceWith(other.id);
});
