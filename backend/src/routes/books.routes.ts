import { Router } from "express";
import * as controller from "../controllers/books.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../middlewares/validate.js";
import { createBookSchema, listBooksQuerySchema, updateBookSchema } from "../schemas/book.schema.js";

export const booksRouter = Router();
booksRouter.get("/", validateQuery(listBooksQuerySchema), controller.list);
booksRouter.get("/:id", controller.get);
booksRouter.post("/", authMiddleware, requireRole("admin"), validateBody(createBookSchema), controller.create);
booksRouter.put("/:id", authMiddleware, requireRole("admin"), validateBody(updateBookSchema), controller.update);
booksRouter.delete("/:id", authMiddleware, requireRole("admin"), controller.remove);
