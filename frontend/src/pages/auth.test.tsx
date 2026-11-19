import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import { routes } from "../router";

const auth = vi.hoisted(() => ({
  login: vi.fn(),
  github: vi.fn(),
  register: vi.fn(),
  signedIn: false,
}));
vi.mock("../lib/auth-client", () => ({
  useSession: () => ({
    isPending: false,
    data: auth.signedIn ? { user: { role: "user" } } : null,
  }),
  signIn: { email: auth.login, social: auth.github },
  signUp: { email: auth.register },
  signOut: vi.fn(),
}));
vi.mock("./Home", () => ({ Home: () => <h1>Library</h1> }));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  auth.signedIn = false;
});

function open(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(<RouterProvider router={router} />);
  return { router, view };
}

function fill(name: string, value: string) {
  fireEvent.change(screen.getByLabelText(name), { target: { value } });
}

test("rejects an invalid registration email before sending credentials", async () => {
  const { view } = open("/register");
  fill("Name", "A Reader");
  fill("Email", "invalid");
  fill("Password", "test-pass-123");
  fireEvent.submit(view.getByRole("form", { name: "Register" }));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Enter a valid email address.",
  );
  expect(auth.register).not.toHaveBeenCalled();
});

test("renders an unsuccessful email sign-in without leaving the form", async () => {
  auth.login.mockResolvedValue({ error: { status: 401 } });
  const { router, view } = open("/login");
  fill("Email", "user@biblioteca.test");
  fill("Password", "invalid-password");
  fireEvent.submit(view.getByRole("form", { name: "Sign in" }));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Email or password is incorrect.",
  );
  expect(router.state.location.pathname).toBe("/login");
});

test("uses the GitHub provider and same-origin callback", async () => {
  auth.github.mockResolvedValue({ error: { status: 404 } });
  open("/login");
  fireEvent.click(screen.getByRole("button", { name: "Continue with GitHub" }));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Could not sign in with GitHub.",
  );
  expect(auth.github).toHaveBeenCalledWith({
    provider: "github",
    callbackURL: "/",
  });
});

test.each(["/login", "/register"])(
  "redirects signed-in visitors from %s",
  async (path) => {
    auth.signedIn = true;
    const { router } = open(path);
    expect(
      await screen.findByRole("heading", { name: "Library" }),
    ).toBeDefined();
    expect(router.state.location.pathname).toBe("/");
  },
);
