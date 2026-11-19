import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { signIn, signUp, useSession } from "../lib/auth-client";
import { authFormSchema, type AuthFields } from "../schemas/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const creating = mode === "register";
  const title = creating ? "Register" : "Sign in";
  const { data, isPending, error } = useSession();
  const [params] = useSearchParams();
  const [githubPending, setGithubPending] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AuthFields>({
    resolver: zodResolver(authFormSchema(mode)),
  });

  if (isPending) return <p role="status">Checking your session…</p>;
  if (error)
    return (
      <p role="alert">Could not verify your session. Reload to try again.</p>
    );
  if (data) return <Navigate to="/" replace />;

  async function submit({ name, email, password }: AuthFields) {
    clearErrors("root");
    try {
      if (creating) {
        const result = await signUp.email({
          name: name ?? "",
          email,
          password,
        });
        if (result.error) {
          setError("root", {
            message: "Could not create the account with these details.",
          });
          return;
        }
        window.location.assign(
          result.data?.token ? "/" : "/login?registered=1",
        );
      } else {
        const result = await signIn.email({ email, password });
        if (result.error) {
          setError("root", {
            message:
              result.error.status === 401
                ? "Email or password is incorrect."
                : "Could not sign in. Try again.",
          });
          return;
        }
        window.location.assign("/");
      }
    } catch {
      setError("root", {
        message: "Could not reach the authentication service. Try again.",
      });
    }
  }

  async function github() {
    setGithubPending(true);
    clearErrors();
    try {
      const result = await signIn.social({
        provider: "github",
        callbackURL: "/",
      });
      if (result.error) throw new Error("GitHub sign-in failed");
    } catch {
      setError("root", { message: "Could not sign in with GitHub." });
      setGithubPending(false);
    }
  }

  const fields = creating
    ? (["name", "email", "password"] as const)
    : (["email", "password"] as const);
  const labels = { name: "Name", email: "Email", password: "Password" };
  const autocomplete = {
    name: "name",
    email: "email",
    password: creating ? "new-password" : "current-password",
  };
  const busy = isSubmitting || githubPending;

  return (
    <section className="mx-auto max-w-md">
      <div className="surface p-8">
        <p className="eyebrow">{creating ? "Join the library" : "Welcome back"}</p>
        <h1 className="font-display mt-3 text-4xl font-semibold text-accent">
          {title}
        </h1>
        <p className="mt-2 text-ink/65">
          {creating
            ? "Create an account to save your reading place."
            : "Sign in to pick up where you left off."}
        </p>
        {!creating && params.get("registered") === "1" && (
          <p role="status">Account created. You can now sign in.</p>
        )}
        <form
          aria-label={title}
          className="mt-7 grid gap-4"
          noValidate
          onSubmit={handleSubmit(submit)}
        >
          {fields.map((field) => (
            <div className="grid gap-1" key={field}>
              <label htmlFor={`auth-${field}`}>{labels[field]}</label>
              <input
                {...register(field)}
                id={`auth-${field}`}
                type={field === "name" ? "text" : field}
                autoComplete={autocomplete[field]}
                aria-invalid={!!errors[field]}
                aria-describedby={
                  errors[field] ? `auth-${field}-error` : undefined
                }
                className="field"
              />
              {errors[field] && (
                <p
                  id={`auth-${field}-error`}
                  role="alert"
                >
                  {errors[field].message}
                </p>
              )}
            </div>
          ))}
          {errors.root && <p role="alert">{errors.root.message}</p>}
          <button
            disabled={busy}
            className="btn-primary mt-2"
            type="submit"
          >
            {isSubmitting ? "Please wait…" : title}
          </button>
          {!creating && (
            <button
              disabled={busy}
              className="btn-secondary"
              type="button"
              onClick={github}
            >
              {githubPending ? "Connecting to GitHub…" : "Continue with GitHub"}
            </button>
          )}
        </form>
        <Link
          className="mt-6 inline-block text-sm text-accent underline underline-offset-4"
          to={creating ? "/login" : "/register"}
        >
          {creating ? "Already registered? Sign in" : "Create an account"}
        </Link>
      </div>
    </section>
  );
}
