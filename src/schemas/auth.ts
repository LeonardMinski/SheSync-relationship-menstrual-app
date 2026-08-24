import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your full name."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type PasswordResetRequestValues = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordUpdateValues = z.infer<typeof passwordUpdateSchema>;
