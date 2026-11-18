export type UserRole = "admin" | "user";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}
