"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type CallbackStatus = "processing" | "success" | "failure";

function readUrlError(): string | null {
  if (typeof window === "undefined") return null;

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return (
    searchParams.get("error_description") ||
    searchParams.get("error") ||
    hashParams.get("error_description") ||
    hashParams.get("error") ||
    null
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [failureReason, setFailureReason] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const urlError = readUrlError();
      if (urlError) {
        if (!cancelled) {
          setFailureReason(urlError);
          setStatus("failure");
        }
        return;
      }

      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;

        if (error) {
          setFailureReason(error.message);
          setStatus("failure");
          return;
        }

        setStatus("success");
        return;
      }

      // No code and no error param: this may be the implicit flow, where the
      // Supabase client parses the URL fragment and establishes a session
      // automatically. Give it one tick, then check the real session state
      // rather than assuming success.
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 300));
      if (cancelled) return;

      const { data, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error || !data.session) {
        setFailureReason(error?.message ?? null);
        setStatus("failure");
        return;
      }

      setStatus("success");
    };

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-bg-surface p-8 text-center shadow-lg">
        {status === "processing" && (
          <div role="status">
            <div className="mx-auto mb-6 flex justify-center">
              <Loader2
                className="h-14 w-14 motion-reduce:animate-none animate-spin text-cta-start"
                aria-hidden="true"
              />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-foreground">
              Confirming your email...
            </h1>
            <p className="text-muted-foreground">
              This will only take a moment.
            </p>
          </div>
        )}

        {status === "success" && (
          <div role="status">
            <div className="mx-auto mb-6 flex justify-center">
              <CheckCircle
                className="h-16 w-16 text-success"
                aria-hidden="true"
              />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-foreground">
              Email confirmed
            </h1>
            <p className="mb-8 text-muted-foreground">
              Your email has been confirmed. You can now continue to your
              dashboard.
            </p>
            <Link href="/dashboard" className="btn-cta inline-flex w-full justify-center">
              Continue to Dashboard
            </Link>
          </div>
        )}

        {status === "failure" && (
          <div role="alert">
            <div className="mx-auto mb-6 flex justify-center">
              <XCircle className="h-16 w-16 text-error" aria-hidden="true" />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-foreground">
              That link didn&apos;t work
            </h1>
            <p className="mb-8 text-muted-foreground">
              {failureReason
                ? failureReason
                : "This confirmation link may be expired or already used. Try signing in, or request a new confirmation email."}
            </p>
            <div className="space-y-3">
              <Link href="/auth/login" className="btn-cta inline-flex w-full justify-center">
                Continue to Login
              </Link>
              <Link
                href="/auth/verify-email"
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                Resend confirmation email
              </Link>
            </div>
          </div>
        )}

        <div className="mt-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
