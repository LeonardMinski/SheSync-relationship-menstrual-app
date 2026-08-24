import {
  loginSchema,
  signupSchema,
  type LoginFormValues,
  type SignupFormValues,
} from "@/schemas/auth";

export type LoginFieldErrors = Partial<Record<keyof LoginFormValues, string>>;
export type SignupFieldErrors = Partial<Record<keyof SignupFormValues, string>>;

export function getLoginFieldErrors(
  result: ReturnType<typeof loginSchema.safeParse>,
): LoginFieldErrors {
  if (result.success) return {};

  const flattened = result.error.flatten().fieldErrors;

  return {
    email: flattened.email?.[0],
    password: flattened.password?.[0],
  };
}

export function getSignupFieldErrors(
  result: ReturnType<typeof signupSchema.safeParse>,
): SignupFieldErrors {
  if (result.success) return {};

  const flattened = result.error.flatten().fieldErrors;

  return {
    name: flattened.name?.[0],
    email: flattened.email?.[0],
    password: flattened.password?.[0],
    confirmPassword: flattened.confirmPassword?.[0],
  };
}
