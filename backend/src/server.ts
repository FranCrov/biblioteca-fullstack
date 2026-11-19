import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { getAuth } from "./lib/auth.js";
import { apiRouter } from "./routes/index.js";
import { errorMiddleware, notFound } from "./middlewares/error.middleware.js";

const app = express();

app.all("/api/auth/*splat", (req, res, next) => {
  try {
    return toNodeHandler(getAuth())(req, res).catch(next);
  } catch (error) {
    return next(error);
  }
});

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1", apiRouter);
app.use("/api", notFound);
app.use(errorMiddleware);

await connectDB();

const listening = () => {
  console.log(`[server] listening on http://localhost:${env.port}`);
};

if (process.env.BIBLIOTECA_LOOPBACK_ONLY === "1") {
  const server = app.listen(env.port, "127.0.0.1", () => {
    listening();
    process.send?.("ready");
  });
  process.once("disconnect", () => server.close(() => process.exit(0)));
} else {
  app.listen(env.port, listening);
}
