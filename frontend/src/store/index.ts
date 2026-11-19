import { configureStore } from "@reduxjs/toolkit";
import { libraryApi } from "./api";

export const store = configureStore({
  reducer: { [libraryApi.reducerPath]: libraryApi.reducer },
  middleware: (defaults) => defaults().concat(libraryApi.middleware),
});
