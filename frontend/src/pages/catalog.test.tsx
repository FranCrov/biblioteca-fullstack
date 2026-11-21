import { configureStore } from "@reduxjs/toolkit";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import { api } from "../lib/api";
import { routes } from "../router";
import { libraryApi } from "../store/api";

vi.mock("../lib/auth-client", () => ({
  useSession: () => ({ data: null, isPending: false }),
  signOut: vi.fn(),
}));

const book = {
  id: "sample",
  title: "One Good Book",
  author: "A. Reader",
  genre: "Fiction",
  publishedYear: 2021,
  isbn: "1234567890",
  available: false,
};
const adapter = api.defaults.adapter;
afterEach(() => {
  cleanup();
  api.defaults.adapter = adapter;
});

function openCatalog(path: string, catalogEmpty = false) {
  const calls: string[] = [];
  api.defaults.adapter = async (config) => {
    const url = api.getUri(config);
    calls.push(url);
    const response = { config, headers: {}, status: 200, statusText: "OK" };
    if (config.url === "/books/sample") return { ...response, data: book };
    if (config.url !== "/books") {
      const missing: AxiosResponse = {
        ...response,
        status: 404,
        data: { error: { message: "Book not found" } },
      };
      throw new AxiosError("Not found", undefined, config, undefined, missing);
    }
    const query = new URL(url, "http://localhost").searchParams;
    const page = Number(query.get("page"));
    const empty = catalogEmpty || query.get("search") === "no match";
    return {
      ...response,
      data: {
        data: empty ? [] : [book],
        meta: {
          page,
          limit: 5,
          totalPages: empty ? 0 : 2,
          total: empty ? 0 : 6,
        },
      },
    };
  };
  const store = configureStore({
    reducer: { [libraryApi.reducerPath]: libraryApi.reducer },
    middleware: (defaults) => defaults().concat(libraryApi.middleware),
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return { calls, router };
}

test("loads URL filters, sends searches and follows pagination without losing filters", async () => {
  const { calls, router } = openCatalog("/?search=first&limit=5");
  expect(
    screen.getByRole("heading", { name: "Library", level: 1 }),
  ).toBeDefined();
  expect(await screen.findByRole("link", { name: book.title })).toBeDefined();
  expect(screen.getByRole("article").textContent).toContain("Unavailable");
  expect(calls[0]).toMatch(/search=first/);
  fireEvent.change(screen.getByRole("searchbox", { name: "Search books" }), {
    target: { value: "next term" },
  });
  await waitFor(() => expect(calls.at(-1)).toMatch(/search=next\+term/));
  fireEvent.click(await screen.findByRole("button", { name: "Next page" }));
  await waitFor(() => expect(calls.at(-1)).toContain("page=2"));
  const query = new URLSearchParams(router.state.location.search);
  expect(Object.fromEntries(query)).toMatchObject({
    search: "next term",
    page: "2",
    limit: "5",
  });
});

test.each([
  ["sample", book.title],
  ["missing", "Book not found"],
])("renders detail or 404 for %s", async (id, heading) => {
  const { calls } = openCatalog(`/books/${id}`);
  expect(await screen.findByRole("heading", { name: heading })).toBeDefined();
  expect(calls).toEqual([`/api/v1/books/${id}`]);
});

test("recovers from a filtered empty result and resets pagination", async () => {
  const { router } = openCatalog(
    "/?search=no+match&available=true&page=2&limit=5",
  );
  expect(
    await screen.findByRole("heading", { name: "No matching books" }),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(await screen.findByRole("link", { name: book.title })).toBeDefined();
  expect(router.state.location.search).toBe("?limit=5");
});

test("distinguishes an empty collection from a filtered result", async () => {
  openCatalog("/", true);
  expect(
    await screen.findByRole("heading", { name: "The collection is empty" }),
  ).toBeDefined();
  expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
});
