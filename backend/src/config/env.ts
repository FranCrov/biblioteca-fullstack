import "dotenv/config";

const parsedPort = Number(process.env.PORT ?? 3000);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number.isFinite(parsedPort) ? parsedPort : 3000,
  mongodbUri: process.env.MONGODB_URI,
  betterAuthSecret: process.env.BETTER_AUTH_SECRET,
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:5173",
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
};

export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
