"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { CoachConversationSummary } from "@/types/coach";

/**
 * Real conversation titles/previews only — no hardcoded example history.
 * An empty list is simply empty; nothing here is ever fabricated to look
 * populated. Rendered inside a titled Modal drawer (see CoachView), so
 * this component owns only the "New" action and the list itself.
 */
export function CoachPreviousConversations({
  conversations,
  activeConversationId,
  loading,
  onOpen,
  onNew,
  onDelete,
}: {
  conversations: CoachConversationSummary[];
  activeConversationId: string | null;
  loading: boolean;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={onNew}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        New
      </Button>

      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No conversations yet.</p>
        ) : (
          conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            const isConfirming = confirmingId === conversation.id;
            return (
              <div
                key={conversation.id}
                className={`rounded-2xl border p-3 transition-colors ${
                  isActive ? "border-[color:var(--accent-rose)] bg-[color:var(--accent-rose)]/10" : "border-border bg-bg-elevated"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpen(conversation.id)}
                    className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                  >
                    <p className="truncate text-sm font-semibold text-foreground">
                      {conversation.title ?? conversation.preview ?? "New conversation"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{format(new Date(conversation.updatedAt), "MMM d, h:mm a")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(conversation.id)}
                    aria-label={`Delete conversation: ${conversation.title ?? "New conversation"}`}
                    className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                {isConfirming && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-error/10 p-2 text-xs">
                    <span className="text-error">Delete this conversation?</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingId(null);
                          onDelete(conversation.id);
                        }}
                        className="font-semibold text-error hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
