import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

test("edits and deletes an existing title after confirmation", async () => {
  open([book]);
  vi.spyOn(window, "confirm").mockReturnValue(true);

  fireEvent.click(screen.getByRole("button", { name: `Edit ${book.title}` }));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Updated Book" } });
  fireEvent.submit(screen.getByRole("form", { name: "Save changes" }));
  await waitFor(() => expect(api.update).toHaveBeenCalledTimes(1));
  expect(api.update.mock.calls[0][0]).toMatchObject({
    id: book.id,
    data: { title: "Updated Book" },
  });

  fireEvent.click(screen.getByRole("button", { name: `Delete ${book.title}` }));
  await waitFor(() => expect(api.remove).toHaveBeenCalledWith(book.id));
});
