import "dotenv/config";
import express from "express";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

const app = express();

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

await connectDB();

app.listen(env.port, () => {
  console.log(`[server] listening on http://localhost:${env.port}`);
});
