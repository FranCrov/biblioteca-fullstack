import type { RequestHandler } from "express";
import * as books from "../services/books.service.js";

export const list: RequestHandler = async (_req, res) => {
  res.json(await books.listBooks(res.locals.validatedQuery));
};
export const get: RequestHandler = async (req, res) => {
  res.json(await books.getBookById(String(req.params.id)));
};
export const create: RequestHandler = async (req, res) => {
  res.status(201).json(await books.createBook(req.body));
};
export const update: RequestHandler = async (req, res) => {
  res.json(await books.updateBook(String(req.params.id), req.body));
};
export const remove: RequestHandler = async (req, res) => {
  await books.deleteBook(String(req.params.id));
  res.status(204).end();
};
