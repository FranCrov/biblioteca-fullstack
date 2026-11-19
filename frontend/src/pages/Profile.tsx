import { Link } from "react-router-dom";
import { useSession } from "../lib/auth-client";
import { isAdmin } from "../types/auth";

export function Profile() {
  const { data } = useSession();
  const user = data?.user;

  return (
    <>
      <p className="eyebrow">Your account</p>
      <h1 className="font-display text-4xl font-semibold text-accent">Profile</h1>
      <section className="surface mt-8 max-w-xl p-7" aria-label="Account details">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-accent font-display text-2xl text-white">
            {(user?.name ?? "R").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-display text-2xl">{user?.name ?? "Reader"}</p>
            <p className="text-ink/70">{user?.email ?? "No email available"}</p>
          </div>
        </div>
        <dl className="mt-7 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3 border-t border-ink/10 pt-6">
          <dt className="text-ink/60">Role</dt>
          <dd>
            <span className="chip">{user?.role ?? "user"}</span>
          </dd>
          <dt className="text-ink/60">Access</dt>
          <dd>
            {isAdmin(user?.role)
              ? "Catalog management and session overview"
              : " Browse and request books"}
          </dd>
        </dl>
        {isAdmin(user?.role) && (
          <Link className="btn-secondary mt-7 inline-flex" to="/admin">
            Open admin desk
          </Link>
        )}
      </section>
    </>
  );
}
