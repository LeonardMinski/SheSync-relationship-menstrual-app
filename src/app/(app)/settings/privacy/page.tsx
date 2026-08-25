import { Metadata } from "next";
import { LockKeyhole } from "lucide-react";

import PrivacySettingsForm from "@/components/settings/PrivacySettingsForm";
import { PublicFooter, PublicHeader } from "@/components/layout/PublicChrome";

export const metadata: Metadata = {
  title: "Privacy Settings | SheSync+",
  description: "Manage your privacy settings and data sharing preferences",
};

export default async function PrivacySettingsPage() {
  return (
    <div className="ss-page min-h-screen text-[color:var(--design-ink)]">
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl space-y-10 px-5 py-16 sm:px-8 lg:px-10">
        <section className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--design-border)] bg-white">
            <LockKeyhole
              className="h-7 w-7 text-[color:var(--design-sage)]"
              aria-hidden="true"
            />
          </div>
          <h1 className="ss-display mt-8 text-5xl font-bold tracking-tight text-[color:var(--design-ink)] md:text-6xl">
            Your data, your control.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-[color:var(--design-muted)]">
            Customize what aspects of your cycle are visible to your connected
            partner. Changes are saved automatically.
          </p>
        </section>

        <PrivacySettingsForm />

        <section className="ss-card p-6 text-center">
          <p className="mx-auto max-w-2xl text-sm font-semibold leading-relaxed text-[color:var(--design-muted)]">
            Partner view only uses the data you explicitly enable here. Private
            notes and locked categories remain hidden.
          </p>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
