import Link from "next/link";
import { BookHeart, Plus } from "lucide-react";

import { InlineBanner } from "@/components/ui/InlineBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { VaultEntryPreviewCard } from "@/components/vault/VaultEntryPreviewCard";

const NEW_ENTRY_LINK_CLASSES =
  "btn-cta inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-3 text-base font-medium";

// UI-only placeholder screen — no Vault persistence exists yet.
// See docs/ROADMAP.md ("Parked/legacy feature code" + "Next") for why the
// old src/services/fantasy/* backend is not reused here.
export default function VaultPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <SectionHeading
        title="Your Vault"
        description="A private place for thoughts, desires, and things you might want to explore at your own pace."
        actions={
          <Link href="/vault/new" className={NEW_ENTRY_LINK_CLASSES}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New entry
          </Link>
        }
      />

      <InlineBanner tone="info">
        Private by default. Entries stay private until you intentionally share a tease or reveal.
      </InlineBanner>

      <EmptyState
        icon={BookHeart}
        title="Nothing here yet"
        description="Start writing to create your first Vault entry. It stays just yours until you choose to share something from it."
        action={
          <Link href="/vault/new" className={NEW_ENTRY_LINK_CLASSES}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Write your first entry
          </Link>
        }
      />

      <VaultEntryPreviewCard />
    </div>
  );
}
