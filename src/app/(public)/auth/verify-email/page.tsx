"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { InlineBanner } from "@/components/ui/InlineBanner";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10 text-foreground">
      <div className="w-full max-w-lg">
        <Card className="border-border bg-[var(--bg-surface)] px-4 py-8 shadow-lg sm:px-10 sm:py-12">
          <CardHeader className="pb-6 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-bg">
              <Mail className="h-7 w-7 text-cta-start" aria-hidden="true" />
            </div>
            <CardTitle as="h1" className="font-display text-3xl font-bold text-foreground">
              Check your email
            </CardTitle>
            <CardDescription className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">
              We&apos;ve sent a verification link to confirm your email address.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <InlineBanner tone="info">
              Check your spam folder if you don&apos;t see the email in your inbox within a few
              minutes.
            </InlineBanner>

            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive it? Resending verification emails isn&apos;t available yet —
              please try{" "}
              <Link href="/auth/signup" className="font-semibold text-[color:var(--accent-rose)] hover:underline">
                signing up again
              </Link>{" "}
              with the same email, or contact support.
            </p>

            <Link
              href="/auth/login"
              className="btn-cta flex min-h-[44px] w-full items-center justify-center"
            >
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
