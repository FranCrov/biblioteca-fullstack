import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import type { Db } from "mongodb";
import { env, requireEnv } from "../config/env.js";
import { getDb } from "../config/db.js";

export interface SocialCredentials {
  githubClientId?: string;
  githubClientSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
}

export function buildSocialProviders(config: SocialCredentials) {
  const providers: {
    github?: { clientId: string; clientSecret: string };
    google?: { clientId: string; clientSecret: string };
  } = {};

  if (config.githubClientId && config.githubClientSecret) {
    providers.github = {
      clientId: config.githubClientId,
      clientSecret: config.githubClientSecret,
    };
  }

  if (config.googleClientId && config.googleClientSecret) {
    providers.google = {
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
    };
  }

  return providers;
}

function createAuth() {
  const db = getDb();
  if (!db)
    throw new Error("MongoDB must be connected before authentication is used");

  return betterAuth({
    database: mongodbAdapter(db as unknown as Db),
    baseURL: env.betterAuthUrl,
    secret: requireEnv("BETTER_AUTH_SECRET", env.betterAuthSecret),
    emailAndPassword: { enabled: true },
    socialProviders: buildSocialProviders(env),
    plugins: [admin({ defaultRole: "user" }), dash()],
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
