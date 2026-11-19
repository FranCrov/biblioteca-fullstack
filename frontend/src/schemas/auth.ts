import { z } from "zod";

export function authFormSchema(mode: "login" | "register") {
  return z
    .object({
      name: z
        .string()
        .trim()
        .max(120, "Use at most 120 characters.")
        .optional(),
      email: z.string().trim().pipe(z.email("Enter a valid email address.")),
      password: z
        .string()
        .min(
          mode === "register" ? 8 : 1,
          mode === "register"
            ? "Use at least 8 characters."
            : "Enter your password.",
        )
        .max(128, "Use at most 128 characters."),
    })
    .refine(({ name }) => mode === "login" || !!name, {
      path: ["name"],
      message: "Enter your name.",
    });
}

export type AuthFields = z.infer<ReturnType<typeof authFormSchema>>;
