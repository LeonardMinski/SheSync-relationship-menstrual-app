"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { passwordUpdateSchema, type PasswordUpdateValues } from "@/schemas/auth";

type PasswordUpdateFieldErrors = Partial<
  Record<keyof PasswordUpdateValues, string>
>;

const getPasswordResetError = (message: string | null | undefined) => {
  if (!message) return "Unable to update your password.";

  if (message.toLowerCase().includes("auth session")) {
    return "This reset link has expired. Request a new password reset email.";
  }

  return message;
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<PasswordUpdateFieldErrors>(
    {},
  );
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const parsed = passwordUpdateSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      const nextFieldErrors = {
        password: flattened.password?.[0],
        confirmPassword: flattened.confirmPassword?.[0],
      } satisfies PasswordUpdateFieldErrors;

      setFieldErrors(nextFieldErrors);
      setError(
        nextFieldErrors.confirmPassword ||
          nextFieldErrors.password ||
          "Check your new password.",
      );
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(parsed.data.password);

      if (!result.success) {
        setError(getPasswordResetError(result.error));
        return;
      }

      setComplete(true);
      setPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-cta-start to-cta-end" />
            <CardTitle className="text-2xl font-bold text-foreground">
              Create New Password
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Choose a new password for your SheSync+ account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {complete ? (
              <div className="space-y-6 text-center" role="status">
                <p className="text-sm text-muted-foreground">
                  Your password has been updated.
                </p>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/dashboard"
                    className="btn-cta inline-flex min-h-[44px] items-center justify-center px-4 py-3 text-base font-medium"
                  >
                    Continue to Dashboard
                  </Link>

                  <Link
                    href="/auth/login"
                    className="btn-secondary inline-flex min-h-[44px] items-center justify-center px-4 py-3 text-base font-medium"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div
                    className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <Input
                    label="New Password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    error={fieldErrors.password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter a new password"
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    error={fieldErrors.confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm your new password"
                  />
                </div>

                <Button
                  type="submit"
                  variant="cta"
                  size="lg"
                  loading={loading}
                  className="w-full"
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Need a new link?{" "}
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-cta-start transition-colors hover:text-cta-end"
                  >
                    Request another email
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
