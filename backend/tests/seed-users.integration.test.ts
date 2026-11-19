import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MongoClient } from "mongodb";
import { expect, test } from "vitest";

const port = process.env.BIBLIOTECA_SEED_MONGO_PORT;
const integration = port ? test : test.skip;

integration(
  "preserves existing data when rerun or when a configured account conflicts",
  async () => {
    if (!port || !/^\d{1,5}$/.test(port) || +port < 1 || +port > 65535) {
      throw new Error(
        "Set BIBLIOTECA_SEED_MONGO_PORT to a disposable loopback MongoDB port",
      );
    }
    const npm = process.env.npm_execpath;
    if (!npm) throw new Error("Run through npm run test");
    const id = randomUUID().replaceAll("-", "");
    const uri = `mongodb://127.0.0.1:${port}/biblioteca_seed_test_${id}`;
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4_000 });
    const db = client.db();
    const admin = "admin@biblioteca.test";
    const user = "user@biblioteca.test";
    const seed = (overrides: Record<string, string> = {}) => {
      const result = spawnSync(process.execPath, [npm, "run", "seed"], {
        encoding: "utf8",
        timeout: 12_000,
        env: {
          ...process.env,
          ADMIN_EMAIL: admin,
          ADMIN_PASSWORD: "Fixture-admin-123!",
          USER_EMAIL: user,
          USER_PASSWORD: "Fixture-user-123!",
          ...overrides,
          MONGODB_URI: uri,
          BETTER_AUTH_URL: "http://127.0.0.1:54023",
          BETTER_AUTH_SECRET: id.repeat(2),
          DOTENV_CONFIG_PATH: join(tmpdir(), `nonexistent-dotenv-${id}`),
          BETTER_AUTH_API_KEY: "",
          GITHUB_CLIENT_ID: "",
          GITHUB_CLIENT_SECRET: "",
          BETTER_AUTH_TELEMETRY_DISABLED: "1",
          npm_config_offline: "true",
          npm_config_update_notifier: "false",
        },
      });
      if (result.error) throw result.error;
      return result;
    };
    const snapshot = () =>
      Promise.all(
        ["user", "account", "session"].map((name) =>
          db.collection(name).find().sort({ _id: 1 }).toArray(),
        ),
      );
    try {
      await client.connect();
      const initial = seed();
      expect(initial.status, initial.stderr).toBe(0);
      const before = await snapshot();
      expect(before[0].map(({ email, role }) => [email, role])).toEqual([
        [admin, "admin"],
        [user, "user"],
      ]);
      const repeated = seed();
      expect(repeated.status, repeated.stderr).toBe(0);
      expect(repeated.stdout).toMatch(
        /admin already exists[\s\S]*user already exists/,
      );
      expect(await snapshot()).toEqual(before);

      const conflict = seed({
        ADMIN_EMAIL: "fresh-admin@biblioteca.test",
        USER_EMAIL: admin,
      });
      expect(conflict.status).toBe(1);
      expect(conflict.stderr).toContain(
        "Existing user seed address has a different role",
      );
      expect(await snapshot()).toEqual(before);

      const changedPassword = seed({
        ADMIN_PASSWORD: "Different-fixture-123!",
      });
      expect(changedPassword.status).toBe(1);
      expect(changedPassword.stderr).toContain(
        "Existing admin seed account does not accept the configured password",
      );
      expect(await snapshot()).toEqual(before);
    } finally {
      try {
        await db.dropDatabase();
      } finally {
        await client.close();
      }
    }
  },
  55_000,
);
