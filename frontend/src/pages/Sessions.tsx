import { useEffect, useState } from "react";
import { adminClient } from "../lib/auth-client";

type SessionRow = {
  id?: string;
  email?: string;
  name?: string;
  expiresAt?: string | Date;
};

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const data = (value as { data?: unknown } | undefined)?.data;
  return Array.isArray(data) ? data : [];
}

function normalize(value: unknown): SessionRow {
  const wrapped = value as {
    session?: { user?: { name?: string; email?: string }; session?: { id?: string; expiresAt?: string | Date } };
    id?: string;
    name?: string;
    email?: string;
    expiresAt?: string | Date;
  };
  const user = wrapped.session?.user;
  const session = wrapped.session?.session;
  return {
    id: session?.id ?? wrapped.id,
    name: user?.name ?? wrapped.name,
    email: user?.email ?? wrapped.email,
    expiresAt: session?.expiresAt ?? wrapped.expiresAt,
  };
}

function formatExpiry(value: SessionRow["expiresAt"]) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function Sessions() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      const usersResult: unknown = await adminClient.listUsers({ query: {} });
      const users = Array.isArray(usersResult)
        ? usersResult
        : ((usersResult as { users?: unknown[] } | undefined)?.users ?? []);
      const lists = await Promise.all(
        users.map((user) =>
          adminClient.listUserSessions({
            userId: (user as { id: string }).id,
          }),
        ),
      );
      const rows = lists.flatMap((result: unknown) =>
        asArray(result).map(normalize),
      );
      if (active) {
        setSessions(rows);
        setStatus("ready");
      }
    })().catch(() => {
      if (active) setStatus("error");
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <p className="eyebrow">Access overview</p>
      <h1 className="font-display text-4xl font-semibold text-accent">
        User sessions
      </h1>
      <p className="mt-2 text-ink/70">Active sessions reported by Better Auth.</p>

      <section className="surface mt-8 overflow-hidden" aria-label="Active sessions">
        {status === "loading" && <p className="p-5" role="status">Loading sessions…</p>}
        {status === "error" && (
          <p className="p-5" role="alert">Could not load sessions.</p>
        )}
        {status === "ready" && sessions.length === 0 && (
          <p className="p-8 text-center text-ink/70">No active sessions were returned.</p>
        )}
        {status === "ready" && sessions.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-paper/60 text-ink/60">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Expires</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, index) => (
                <tr className="border-b border-ink/5 last:border-0" key={session.id ?? index}>
                  <td className="px-5 py-4">{session.name ?? "—"}</td>
                  <td className="px-5 py-4">{session.email ?? "—"}</td>
                  <td className="px-5 py-4">{formatExpiry(session.expiresAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
