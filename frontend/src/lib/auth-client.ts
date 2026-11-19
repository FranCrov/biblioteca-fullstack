import { adminClient as adminPlugin } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [adminPlugin()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
export const adminClient = authClient.admin;
