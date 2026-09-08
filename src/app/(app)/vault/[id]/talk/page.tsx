"use client";

import { use, useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowUp } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { addReply, getReplies } from "@/services/relationship/replies";
import { VaultBackLink, VaultButton, VaultCard, VaultHeader, VaultPill, VaultRoom } from "@/components/vault/primitives";
import { cn } from "@/utils/cn";
import type { SharedReply } from "@/types/relationship";

export default function VaultTalkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [replies, setReplies] = useState<SharedReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const result = await getReplies("vault_spark", id);
    if (result.success && result.data) {
      setReplies(result.data.replies);
    } else if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    setError(null);
    const result = await addReply("vault_spark", id, draft.trim());
    if (result.success && result.data) {
      setReplies((current) => [...current, result.data!.reply]);
      setDraft("");
    } else if (!result.success) {
      setError(result.error);
    }
    setSending(false);
  }

  return (
    <VaultRoom>
      <VaultBackLink href={`/vault/${id}`} label="Back to Spark" />
      <VaultHeader
        eyebrow="Focused Talk"
        title="An intimate room for this Spark"
        subtitle="A conversation specifically centered on translating this shared Spark into reality."
        pill={<VaultPill tone="rose">Spark Talk Active</VaultPill>}
      />

      <VaultCard className="flex h-[60vh] flex-col gap-4">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {loading && <p className="text-sm text-[var(--vault-text-muted)]">Loading conversation...</p>}
          {!loading && replies.length === 0 && (
            <p className="text-sm text-[var(--vault-text-muted)]">
              Nothing here yet — say something about this Spark.
            </p>
          )}
          {replies.map((reply) => {
            const own = reply.authorId === user?.id;
            return (
              <div key={reply.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5",
                    own
                      ? "rounded-br-md bg-[color:var(--vault-accent-rose)]/10 border border-[color:var(--vault-accent-rose)]/25"
                      : "rounded-bl-md border border-[var(--vault-border)] bg-[var(--vault-bg-sidebar)]",
                  )}
                >
                  <p className="text-sm leading-relaxed text-[var(--vault-text-primary)]">{reply.content}</p>
                  <p className="mt-1 text-[10px] text-[var(--vault-text-muted)]">
                    {format(new Date(reply.createdAt), "d MMM, HH:mm")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}

        <div className="flex items-center gap-3 rounded-2xl border border-[var(--vault-border-surface)] bg-[var(--vault-bg-sidebar)] p-3">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Type an intimate message about this Spark..."
            className="flex-1 bg-transparent text-sm text-[var(--vault-text-primary)] placeholder:text-[var(--vault-text-muted)] focus:outline-none"
          />
          <VaultButton
            variant="cta"
            className="h-10 w-10 shrink-0 !rounded-full !p-0"
            disabled={sending || !draft.trim()}
            onClick={handleSend}
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </VaultButton>
        </div>
      </VaultCard>
    </VaultRoom>
  );
}
