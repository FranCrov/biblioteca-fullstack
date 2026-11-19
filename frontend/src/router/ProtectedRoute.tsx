import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../lib/auth-client";
import { isAdmin, type UserRole } from "../types/auth";

export function ProtectedRoute({ roles }: { roles?: readonly UserRole[] }) {
  const { data, isPending, error } = useSession();

  if (isPending) return <p role="status">Checking your session…</p>;
  if (error)
    return (
      <p role="alert">Could not verify your session. Reload to try again.</p>
    );
  if (!data) return <Navigate to="/login" replace />;
  if (
    roles &&
    !roles.some((role) =>
      role === "admin" ? isAdmin(data.user.role) : data.user.role === role,
    )
  ) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
