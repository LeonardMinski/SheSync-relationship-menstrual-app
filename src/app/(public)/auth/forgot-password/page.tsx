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
import { InlineBanner } from "@/components/ui/InlineBanner";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");
    setLoading(true);

    const submittedEmail = email.trim().toLowerCase();

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/auth/reset-password` : undefined;

    try {
      const result = await requestPasswordReset(submittedEmail, redirectTo);
      if (!result.success) {
        setError(result.error || "Unable to send reset email");
        return;
      }

      setSuccess("If an account exists for this email, a reset link has been sent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10 text-foreground">
      <div className="w-full max-w-lg">
        <Card className="border-border bg-[var(--bg-surface)] px-4 py-8 shadow-lg sm:px-10 sm:py-12">
          <CardHeader className="pb-6 text-center">
            <CardTitle as="h1" className="font-display text-3xl font-bold text-foreground">
              Reset your password
            </CardTitle>
            <CardDescription className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">
              Enter your email and we&apos;ll send a reset link.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && <InlineBanner tone="error">{error}</InlineBanner>}
              {success && <InlineBanner tone="success">{success}</InlineBanner>}

              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />

              <Button type="submit" variant="cta" loading={loading} className="w-full">
                {loading ? "Sending reset link..." : "Send reset link"}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm font-semibold text-[color:var(--accent-rose)] hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
