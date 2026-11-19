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
      window.location.assign("/");
    } catch {
      setLogoutError(true);
      setSigningOut(false);
    }
  }

  const user = !error && data?.user;
  const navLink = "rounded-full px-3 py-1.5 text-sm font-medium text-ink/70 transition hover:bg-white/70 hover:text-accent";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/80 backdrop-blur-xl">
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-6 py-3"
        >
          <Link to="/" className="mr-auto flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent font-display text-lg text-white shadow-sm">
              B
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-accent">
              Biblioteca
            </span>
          </Link>
          <Link to="/" className={navLink}>
            Catalog
          </Link>
          {!isPending &&
            !error &&
            (user ? (
              <>
                <Link to="/profile" className={navLink}>
                  Profile
                </Link>
                {isAdmin(user.role) && (
                  <>
                    <Link to="/admin" className={navLink}>
                      Admin
                    </Link>
                    <Link to="/admin/sesiones" className={navLink}>
                      Sessions
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  className="btn-secondary ml-1 text-sm"
                  onClick={logout}
                  disabled={signingOut}
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={navLink}>
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Register
                </Link>
              </>
            ))}
        </nav>
        {logoutError && (
          <p role="alert" className="mx-auto max-w-6xl px-6 py-2">
            Could not sign out. Try again.
          </p>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl px-6 pb-10 pt-4 text-sm text-ink/50">
        Biblioteca · a quiet place for good books
      </footer>
    </div>
  );
}
