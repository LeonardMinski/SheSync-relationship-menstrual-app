"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
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

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkRecoverySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (data.session) {
        setSessionReady(true);
      } else {
        setError("This reset link is invalid or expired. Request a new one.");
      }
    };

    checkRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(password);
      if (!result.success) {
        setError(result.error || "Unable to update password");
        return;
      }

      setSuccess("Password updated. Redirecting to sign in...");
      setTimeout(() => {
        router.replace("/auth/login");
      }, 1200);
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
              Choose a new password
            </CardTitle>
            <CardDescription className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">
              Set a new password for your account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && <InlineBanner tone="error">{error}</InlineBanner>}
              {success && <InlineBanner tone="success">{success}</InlineBanner>}

              <Input
                id="password"
                name="password"
                type="password"
                label="New password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm new password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />

              <Button
                type="submit"
                variant="cta"
                loading={loading}
                disabled={!sessionReady}
                className="w-full"
              >
                {loading ? "Updating password..." : "Update password"}
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
