import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { signOut, useSession } from "../lib/auth-client";
import { isAdmin } from "../types/auth";

export function Layout() {
  const { data, isPending, error } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  async function logout() {
    setSigningOut(true);
    setLogoutError(false);
    try {
      const result = await signOut();
      if (result.error) throw new Error("Sign-out failed");
      // A full navigation starts a new in-memory query cache.
      window.location.assign("/");
    } catch {
      setLogoutError(true);
      setSigningOut(false);
    }
  }

  const user = !error && data?.user;
  return (
    <>
      <header className="border-b border-ink/15">
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3"
        >
          <Link to="/" className="font-bold text-accent">
            Catalog
          </Link>
          {!isPending &&
            !error &&
            (user ? (
              <>
                <Link to="/profile">Profile</Link>
                {isAdmin(user.role) && <Link to="/admin">Admin</Link>}
                <button
                  type="button"
                  className="underline"
                  onClick={logout}
                  disabled={signingOut}
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Sign in</Link>
                <Link to="/register">Register</Link>
              </>
            ))}
        </nav>
        {logoutError && (
          <p role="alert" className="mx-auto max-w-5xl px-6 py-2">
            Could not sign out. Try again.
          </p>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Outlet />
      </main>
    </>
  );
}
