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
import { passwordResetRequestSchema } from "@/schemas/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setEmailError("");

    const parsed = passwordResetRequestSchema.safeParse({ email });

    if (!parsed.success) {
      const nextError =
        parsed.error.flatten().fieldErrors.email?.[0] ||
        "Enter a valid email address.";
      setEmailError(nextError);
      setError(nextError);
      return;
    }

    setLoading(true);

    try {
      const result = await requestPasswordReset(parsed.data.email);

      if (!result.success) {
        setError(result.error || "Unable to send password reset email.");
        return;
      }

      setSubmitted(true);
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
              Reset Password
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your email and we will send you a reset link.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submitted ? (
              <div className="space-y-6 text-center" role="status">
                <p className="text-sm text-muted-foreground">
                  If an account exists for that email, a password reset link
                  will arrive shortly.
                </p>

                <Link
                  href="/auth/login"
                  className="btn-cta inline-flex min-h-[44px] items-center justify-center px-4 py-3 text-base font-medium"
                >
                  Back to Sign In
                </Link>
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

                <Input
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  error={emailError}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                />

                <Button
                  type="submit"
                  variant="cta"
                  size="lg"
                  loading={loading}
                  className="w-full"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Remembered your password?{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-cta-start transition-colors hover:text-cta-end"
                  >
                    Sign in
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
