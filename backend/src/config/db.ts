import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(): Promise<void> {
  if (!env.mongodbUri) {
    console.warn("[db] MONGODB_URI is not set; skipping database connection.");
    return;
  }

  try {
    await mongoose.connect(env.mongodbUri);
    console.log("[db] MongoDB connected");
  } catch (error) {
    console.error("[db] MongoDB connection failed", error);
    throw error;
  }
}

export function getDb() {
  return mongoose.connection.db;
}
