import { Router } from "express";
import { booksRouter } from "./books.routes.js";

export const apiRouter = Router();
apiRouter.use("/books", booksRouter);
