"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { createCheckoutSession } from "@/services/checkout";

const FREE_FEATURES = [
  "Daily wellbeing logging",
  "Basic history trends",
  "Privacy controls",
  "Partner connection",
  "Limited prompts",
];

const PREMIUM_FEATURES = [
  "AI Coach",
  "Advanced analytics",
  "Vault",
  "Partner Translation",
  "Extended intimacy library",
];

export default function PricingPageRoute() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlockPremium() {
    setLoading(true);
    setError(null);

    const result = await createCheckoutSession("premium");

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    window.location.href = result.data.url;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <SectionHeading
        title="Elevate your wellbeing journey."
        description="Share what matters, keep what's private. We never paywall privacy controls."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SheSync+ Free</CardTitle>
            <p className="text-3xl font-bold text-foreground">
              $0<span className="text-base font-normal text-muted-foreground">/mo</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <ul className="space-y-2.5">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent-sage)]" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Stay with Free
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[color:var(--accent-premium)]/50 bg-[color:var(--accent-premium)] text-[color:var(--accent-premium-foreground)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-white">SheSync+ Premium</CardTitle>
              <PremiumBadge className="bg-white/15 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">
              $9.99<span className="text-base font-normal text-white/70">/mo</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <ul className="space-y-2.5">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-white">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            {error && <p className="text-sm text-white">{error}</p>}
            <Button variant="cta" className="w-full" disabled={loading} onClick={handleUnlockPremium}>
              {loading ? "Redirecting to checkout…" : "Unlock Premium"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
