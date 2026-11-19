export type BookInput = {
  title: string;
  author: string;
  genre: string;
  publishedYear: number;
  isbn: string;
  available: boolean;
};

export type Book = BookInput & {
  id: string;
  addedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type BookList = {
  data: Book[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};
