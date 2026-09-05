"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { canUseTracking } from "@/features/account/capabilities";
import { completeOnboarding } from "@/services/onboarding";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { InlineBanner } from "@/components/ui/InlineBanner";
import { StatusPill } from "@/components/ui/StatusPill";

type Step = 1 | 2 | 3;

const TRACKING_STEP_LABELS: Record<Step, string> = {
  1: "Welcome",
  2: "Cycle",
  3: "Privacy Promise",
};

const PARTNER_STEP_LABELS: Record<Step, string> = {
  1: "Welcome",
  2: "Sharing",
  3: "Privacy Promise",
};

// Only whether onboarding was completed is persisted (see
// src/services/onboarding). Step 2 is deliberately informational only — we
// do not collect cycle data here (last period date, cycle length) that
// would be immediately discarded. There is no agreed, persisted
// cycle-baseline model yet; real cycle logging happens on the Cycle page.
//
// Two conceptual onboarding paths share this one page rather than separate
// routes: a partner-only account (tracking_enabled = false) must not be
// walked through cycle-tracking framing just because she signed up — see
// RULE 6 / RULE 8 in the account-capabilities slice.
export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const isPartnerOriented = !canUseTracking(user);
  const [step, setStep] = useState<Step>(1);
  const STEP_LABELS = isPartnerOriented ? PARTNER_STEP_LABELS : TRACKING_STEP_LABELS;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    const result = await completeOnboarding();

    if (!result.success) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }

    await refreshUser();
    router.replace("/dashboard");
    // Intentionally leave `submitting` true — we're navigating away, and
    // resetting it here would just re-enable the button for a moment.
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-center gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <StatusPill key={s} tone={s === step ? "sage" : "muted"}>
            Step {s}: {STEP_LABELS[s]}
          </StatusPill>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {step === 1 && (
            <div className="space-y-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step 1: Welcome
              </p>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Welcome to your space
              </h1>
              <p className="text-muted-foreground">
                Understand yourself. Share only what you choose.
              </p>
              <p className="text-sm text-muted-foreground">
                {isPartnerOriented
                  ? "Next, we'll walk through how partner sharing works and your privacy promise."
                  : "Next, we'll introduce cycle logging and walk through your privacy promise."}
              </p>
            </div>
          )}

          {step === 2 && isPartnerOriented && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step 2: How sharing works
              </p>
              <h1 className="font-display text-2xl font-bold text-foreground">
                You&apos;ll see what they choose to share
              </h1>
              <p className="text-sm text-muted-foreground">
                SheSync+ doesn&apos;t track your own cycle or wellbeing — this account is set
                up to support a partner instead.
              </p>
              <p className="text-sm text-muted-foreground">
                Once you&apos;re connected, you&apos;ll only see what your partner chooses to
                share with you. Nothing more.
              </p>
            </div>
          )}

          {step === 2 && !isPartnerOriented && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step 2: Cycle introduction
              </p>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Your cycle, your pace
              </h1>
              <p className="text-sm text-muted-foreground">
                You can start logging your cycle and wellbeing whenever you&apos;re ready.
                SheSync+ won&apos;t guess what you haven&apos;t told us.
              </p>
              <p className="text-sm text-muted-foreground">
                When you&apos;re ready, you&apos;ll log each day on the Cycle page — mood,
                energy, symptoms, and notes, entirely at your own pace.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step 3: Secure boundary
              </p>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Your privacy promise
              </h1>
              <div className="rounded-xl border border-[color:var(--accent-sage)]/30 bg-[color:var(--accent-sage-soft)]/25 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {isPartnerOriented
                    ? "What you see is entirely up to your partner."
                    : "Your logs, fantasies and reflections start private."}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isPartnerOriented
                    ? "You'll only ever see what they explicitly choose to share, and that can change at any time."
                    : "You decide what crosses into your shared space. Partner connection is entirely optional and can be changed anytime from Settings."}
                </p>
              </div>

              {submitError && (
                <InlineBanner tone="error">{submitError}</InlineBanner>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {step > 1 ? (
              <Button
                variant="secondary"
                disabled={submitting}
                onClick={() => setStep((current) => (current - 1) as Step)}
              >
                Back
              </Button>
            ) : (
              <span />
            )}

            {step < 3 ? (
              <Button variant="cta" onClick={() => setStep((current) => (current + 1) as Step)}>
                Continue
              </Button>
            ) : (
              <Button variant="cta" loading={submitting} onClick={handleComplete}>
                {submitting ? "Setting up..." : "Start using SheSync+"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
