import Link from "next/link";
import { MessageCircleHeart } from "lucide-react";

// The dedicated Partner Translation surface (translating a logged state into
// language to share with a partner) is being built by another workstream at
// a not-yet-final route. Linking to /coach for now — update this href when
// that surface ships.
export function RelationshipTranslationTeaser() {
  return (
    <Link
      href="/coach"
      className="flex min-h-[44px] flex-col gap-3 rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md transition-colors hover:border-cta-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent-amber-soft)] text-[color:var(--accent-amber)]">
        <MessageCircleHeart className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="font-display text-xl font-bold text-foreground">
        Want help explaining how you&apos;re feeling?
      </span>
      <span className="text-sm text-muted-foreground">
        Turn today&apos;s check-in into words you can share with your partner.
      </span>
    </Link>
  );
}
