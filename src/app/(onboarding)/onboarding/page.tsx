"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { Input } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Welcome",
  2: "Cycle",
  3: "Privacy Promise",
};

// UI-only onboarding sequence. Nothing entered here is persisted yet — see
// the FeaturePlaceholder on step 2 and the TODO below.
// TODO(V1-ONBOARDING): once a real "has completed onboarding" + cycle-setup
// field exists on the user profile, wire step 2's fields and the final
// button to a real save call instead of routing straight to /dashboard.
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [lastPeriodDate, setLastPeriodDate] = useState("");
  const [cycleLength, setCycleLength] = useState("28");

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
                Next, we&apos;ll optionally set up your cycle baseline and walk through your
                privacy promise. Every setting here is optional and can be changed later.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step 2: Cycle setup
              </p>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Intimate rhythms
              </h1>
              <p className="text-sm text-muted-foreground">
                Let&apos;s set your baseline. Completely optional — skip if you&apos;d rather log
                as you go.
              </p>
              <Input
                type="date"
                label="Last period start date"
                value={lastPeriodDate}
                onChange={(event) => setLastPeriodDate(event.target.value)}
              />
              <Input
                type="number"
                min={15}
                max={45}
                label="Usual cycle length (days)"
                value={cycleLength}
                onChange={(event) => setCycleLength(event.target.value)}
              />
              <FeaturePlaceholder
                title="Not saved to your profile yet"
                description="This is a design preview of onboarding. Your real cycle history is still logged day-by-day on the Cycle page — nothing you enter here is saved yet."
              />
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
                  Your logs, fantasies and reflections start private.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  You decide what crosses into your shared space. Partner connection is
                  entirely optional and can be changed anytime from Settings.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep((current) => (current - 1) as Step)}>
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
              <Button variant="cta" onClick={() => router.push("/dashboard")}>
                Start using SheSync+
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
