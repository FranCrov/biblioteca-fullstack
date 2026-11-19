import mongoose from "mongoose";
import { z } from "zod";
import { connectDB, getDb } from "../src/config/db.js";
import { env, requireEnv } from "../src/config/env.js";
import { getAuth } from "../src/lib/auth.js";

const email = z.string().trim().toLowerCase().pipe(z.email());
const password = z.string().min(8).max(128);
const config = z.object({
  ADMIN_EMAIL: email,
  ADMIN_PASSWORD: password,
  USER_EMAIL: email,
  USER_PASSWORD: password,
});

async function seed() {
  const parsed = config.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map(({ path }) => path.join("."))
      .join(", ");
    throw new Error(`Missing or invalid seed settings: ${fields}`);
  }

  const settings = parsed.data;
  if (settings.ADMIN_EMAIL === settings.USER_EMAIL) {
    throw new Error("ADMIN_EMAIL and USER_EMAIL must differ");
  }
  requireEnv("MONGODB_URI", env.mongodbUri);
  requireEnv("BETTER_AUTH_SECRET", env.betterAuthSecret);
  await connectDB();
  const db = getDb();
  if (!db) throw new Error("MongoDB is not connected");
  const users = db.collection<{ email: string; role?: string }>("user");

  const accounts = [
    {
      name: "Test Administrator",
      email: settings.ADMIN_EMAIL,
      password: settings.ADMIN_PASSWORD,
      role: "admin",
    },
    {
      name: "Test User",
      email: settings.USER_EMAIL,
      password: settings.USER_PASSWORD,
      role: "user",
    },
  ];

  const auth = getAuth();
  const { internalAdapter, password: verifier } = await auth.$context;
  const existingEmails = new Set<string>();
  for (const { role, email, password } of accounts) {
    const existing = await internalAdapter.findUserByEmail(email, {
      includeAccounts: true,
    });
    if (!existing) continue;
    const currentRole = "role" in existing.user ? existing.user.role : undefined;
    if ((currentRole ?? "user") !== role) {
      throw new Error(
        `Existing ${role} seed address has a different role; no role was changed`,
      );
    }
    const credential = existing.accounts.find(
      (account) =>
        account.providerId === "credential" &&
        account.accountId === existing.user.id,
    );
    if (
      !credential?.password ||
      !(await verifier.verify({ hash: credential.password, password }))
    ) {
      throw new Error(
        `Existing ${role} seed account does not accept the configured password`,
      );
    }
    existingEmails.add(email);
  }

  for (const { role, ...body } of accounts) {
    if (existingEmails.has(body.email)) {
      console.log(`[seed] ${role} already exists`);
      continue;
    }

    const { user } = await auth.api.signUpEmail({ body });
    if (role === "admin") {
      // Never promote an existing account, including one registered during this run.
      const created = await users.findOne({ email: body.email });
      if (!created || String(created._id) !== user.id) {
        throw new Error(
          "Could not confirm ownership of the newly created admin account",
        );
      }
      const result = await users.updateOne(
        { _id: created._id, email: body.email, role: "user" },
        { $set: { role: "admin" } },
      );
      if (result.modifiedCount !== 1)
        throw new Error("Could not set the new account's admin role");
    }
    console.log(`[seed] ${role} created`);
  }
}

try {
  await seed();
} catch (error) {
  console.error(
    `[seed] ${error instanceof Error ? error.message : "Failed to seed accounts"}`,
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
