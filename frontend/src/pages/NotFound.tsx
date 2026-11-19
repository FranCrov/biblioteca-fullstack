import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <>
      <h1 className="text-3xl font-bold">Page not found</h1>
      <Link to="/" className="mt-3 inline-block underline">
        Back to catalog
      </Link>
    </>
  );
}
