"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { getAppreciations, sendAppreciation } from "@/services/relationship/appreciations";
import type { Appreciation } from "@/types/relationship";

export function AppreciationComposer({ partnerName }: { partnerName: string }) {
  const [content, setContent] = useState("");
  const [sent, setSent] = useState<Appreciation | null>(null);
  const [recent, setRecent] = useState<Appreciation[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAppreciations().then((result) => {
      if (result.success) setRecent(result.data.appreciations);
    });
  }, []);

  async function handleSend() {
    if (!content.trim()) return;
    setSending(true);
    setError(null);
    const result = await sendAppreciation(content.trim());
    setSending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSent(result.data.appreciation);
    setRecent((current) => [result.data.appreciation, ...current]);
    setContent("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-[1.5rem] border border-border bg-bg-surface p-6">
        <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">Appreciation Cards</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Praise doesn&apos;t need to be performance-tracked. Just say thank you for being who they
          are.
        </p>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={5}
          maxLength={1000}
          placeholder="Something I appreciated about you today..."
          className="mt-5 w-full rounded-lg border border-border bg-bg-elevated p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
        />

        {error && <p className="mt-2 text-sm text-error">{error}</p>}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">No metrics, no streaks. Just human context.</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setContent("")}>
              Clear
            </Button>
            <Button variant="cta" size="sm" onClick={handleSend} loading={sending} disabled={!content.trim()}>
              Send to {partnerName}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sent && (
          <div className="rounded-[1.5rem] border border-[color:var(--accent-purple)]/30 bg-[color:var(--accent-purple-soft)] p-5">
            <p className="font-display text-lg italic text-foreground">&quot;{sent.content}&quot;</p>
            <p className="mt-3 text-xs text-muted-foreground">Sent to {partnerName} · Today</p>
            <p className="mt-1 text-xs text-muted-foreground">This card is stored privately in your relationship space.</p>
          </div>
        )}

        {recent.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Recent</h2>
            <div className="mt-2 space-y-2">
              {recent.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-bg-surface p-3">
                  <p className="text-sm text-foreground">&quot;{item.content}&quot;</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.direction === "sent" ? `You → ${partnerName}` : `${partnerName} → You`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
