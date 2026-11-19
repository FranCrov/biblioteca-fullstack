import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import { isAxiosError, type AxiosRequestConfig } from "axios";
import { api } from "../lib/api";
import type { BookFilters } from "../schemas/book.schema";
import type { Book, BookInput, BookList } from "../types/book";

type ApiRequest = Pick<
  AxiosRequestConfig,
  "url" | "method" | "params" | "data"
>;
type ApiError = { status: number | "FETCH_ERROR"; message: string };

const axiosBaseQuery: BaseQueryFn<ApiRequest, unknown, ApiError> = async (
  request,
  { signal },
) => {
  try {
    const { data } = await api({ ...request, signal });
    return { data };
  } catch (error) {
    if (
      isAxiosError<{ error?: { message?: string } }>(error) &&
      error.response
    ) {
      const message = error.response.data?.error?.message;
      return {
        error: {
          status: error.response.status,
          message:
            typeof message === "string" ? message : "The request failed.",
        },
      };
    }
    return {
      error: { status: "FETCH_ERROR", message: "Could not reach the library." },
    };
  }
};

export const libraryApi = createApi({
  reducerPath: "libraryApi",
  baseQuery: axiosBaseQuery,
  tagTypes: ["Books"],
  endpoints: () => ({}),
});

export const booksApi = libraryApi.injectEndpoints({
  endpoints: (build) => ({
    getBooks: build.query<BookList, BookFilters>({
      query: (params) => ({ url: "/books", params }),
      providesTags: ["Books"],
    }),
    getBookById: build.query<Book, string>({
      query: (id) => ({ url: `/books/${encodeURIComponent(id)}` }),
      providesTags: ["Books"],
    }),
    createBook: build.mutation<Book, BookInput>({
      query: (data) => ({ url: "/books", method: "POST", data }),
      invalidatesTags: (_result, error) => (error ? [] : ["Books"]),
    }),
    updateBook: build.mutation<Book, { id: string; data: Partial<BookInput> }>({
      query: ({ id, data }) => ({
        url: `/books/${encodeURIComponent(id)}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["Books"]),
    }),
    deleteBook: build.mutation<void, string>({
      query: (id) => ({
        url: `/books/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["Books"]),
    }),
  }),
});

export const {
  useGetBooksQuery,
  useGetBookByIdQuery,
  useCreateBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation,
} = booksApi;
