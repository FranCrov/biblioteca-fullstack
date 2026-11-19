import { type RouteObject } from "react-router-dom";
import { Layout } from "../layouts/Layout";
import { Admin } from "../pages/Admin";
import { AuthForm } from "../pages/AuthForm";
import { BookDetail } from "../pages/BookDetail";
import { Home } from "../pages/Home";
import { NotFound } from "../pages/NotFound";
import { Profile } from "../pages/Profile";
import { Sessions } from "../pages/Sessions";
import { ProtectedRoute } from "./ProtectedRoute";

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "books/:id", element: <BookDetail /> },
      { path: "login", element: <AuthForm key="login" mode="login" /> },
      {
        path: "register",
        element: <AuthForm key="register" mode="register" />,
      },
      {
        element: <ProtectedRoute />,
        children: [{ path: "profile", element: <Profile /> }],
      },
      {
        element: <ProtectedRoute roles={["admin"]} />,
        children: [
          { path: "admin", element: <Admin /> },
          { path: "admin/sesiones", element: <Sessions /> },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
];
