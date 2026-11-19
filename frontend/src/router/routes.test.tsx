import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import { routes } from "./index";

const session = vi.hoisted(() => ({
  role: undefined as string | undefined,
  pending: false,
}));
vi.mock("../lib/auth-client", () => ({
  useSession: () => ({
    isPending: session.pending,
    data: session.role
      ? { user: { name: "Reader", role: session.role } }
      : null,
  }),
  signOut: vi.fn(),
}));
vi.mock("../pages/Home", () => ({ Home: () => <h1>Library</h1> }));
vi.mock("../pages/BookDetail", () => ({
  BookDetail: () => <h1>Book details</h1>,
}));

afterEach(() => {
  cleanup();
  session.pending = false;
});

test.each([
  ["/admin", undefined, "/login", "Sign in"],
  ["/admin", "user", "/", "Library"],
  ["/admin", "admin", "/admin", "Manage books"],
  ["/admin/sesiones", "user", "/", "Library"],
  ["/admin/sesiones", "admin", "/admin/sesiones", "User sessions"],
  ["/profile", undefined, "/login", "Sign in"],
  ["/profile", "user", "/profile", "Profile"],
  ["/books/item", undefined, "/books/item", "Book details"],
])("routes %s with role %s to %s", async (path, role, destination, heading) => {
  session.role = role;
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);

  expect(await screen.findByRole("heading", { name: heading })).toBeDefined();
  expect(router.state.location.pathname).toBe(destination);
});

test("waits for the session before deciding whether to redirect", () => {
  session.role = undefined;
  session.pending = true;
  const router = createMemoryRouter(routes, { initialEntries: ["/admin"] });
  render(<RouterProvider router={router} />);

  expect(screen.getByRole("status").textContent).toBe("Checking your session…");
  expect(router.state.location.pathname).toBe("/admin");
});
