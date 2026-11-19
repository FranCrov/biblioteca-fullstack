import { Link, type RouteObject } from "react-router-dom";
import App from "../App";
import { Layout } from "../layouts/Layout";
import { NotFound } from "../pages/NotFound";
import { ProtectedRoute } from "./ProtectedRoute";

function PageHeading({ children }: { children: string }) {
  return <h1 className="text-3xl font-bold text-accent">{children}</h1>;
}

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <App /> },
      { path: "books/:id", element: <PageHeading>Book details</PageHeading> },
      { path: "login", element: <PageHeading>Sign in</PageHeading> },
      { path: "register", element: <PageHeading>Register</PageHeading> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "profile", element: <PageHeading>Profile</PageHeading> },
        ],
      },
      {
        element: <ProtectedRoute roles={["admin"]} />,
        children: [
          {
            path: "admin",
            element: (
              <>
                <PageHeading>Manage books</PageHeading>
                <Link
                  to="/admin/sesiones"
                  className="mt-3 inline-block underline"
                >
                  User sessions
                </Link>
              </>
            ),
          },
          {
            path: "admin/sesiones",
            element: <PageHeading>User sessions</PageHeading>,
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
];
