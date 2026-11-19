export type UserRole = "admin" | "user";

export function isAdmin(role: string | null | undefined): boolean {
  return role === "admin";
}
