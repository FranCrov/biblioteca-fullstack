import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import { isAxiosError, type AxiosRequestConfig } from "axios";
import { api } from "../lib/api";

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
