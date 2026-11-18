import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import type { Db } from "mongodb";
import { env, requireEnv } from "../config/env.js";
import { getDb } from "../config/db.js";

function createAuth() {
  const db = getDb();
  if (!db)
    throw new Error("MongoDB must be connected before authentication is used");

  const socialProviders =
    env.githubClientId && env.githubClientSecret
      ? {
          github: {
            clientId: env.githubClientId,
            clientSecret: env.githubClientSecret,
          },
        }
      : {};

  return betterAuth({
    database: mongodbAdapter(db as unknown as Db),
    baseURL: env.betterAuthUrl,
    secret: requireEnv("BETTER_AUTH_SECRET", env.betterAuthSecret),
    emailAndPassword: { enabled: true },
    socialProviders,
    plugins: [admin({ defaultRole: "user" })],
    account: {
      accountLinking: { enabled: true, trustedProviders: ["github"] },
    },
    trustedOrigins: [env.betterAuthUrl],
  });
}

type AuthInstance = ReturnType<typeof createAuth>;
let authInstance: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  if (!authInstance) authInstance = createAuth();
  return authInstance;
}
