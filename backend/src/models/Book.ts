import { Document, Schema, model } from "mongoose";

export interface BookDocument extends Document {
  title: string;
  author: string;
  genre: string;
  publishedYear: number;
  isbn: string;
  available: boolean;
  addedAt: Date;
}

const bookSchema = new Schema<BookDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    author: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    genre: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    publishedYear: {
      type: Number,
      required: true,
      min: 1450,
      max: new Date().getFullYear() + 1,
    },
    isbn: {
      type: String,
      required: true,
      match: /^(?:\d{10}|\d{13})$/,
      unique: true,
    },
    available: { type: Boolean, default: true, required: true },
    addedAt: { type: Date, default: Date.now, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_document, result) => {
        const serialized = result as Record<string, unknown>;
        serialized.id = String(serialized._id);
        delete serialized._id;
        delete serialized.__v;
        return serialized;
      },
    },
  },
);

export const Book = model<BookDocument>("Book", bookSchema);
