"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { History, Plus } from "lucide-react";

import { StatusPill } from "@/components/ui/StatusPill";
import { useAuth } from "@/context/AuthContext";
import { useCoachWorkspace } from "@/hooks/useCoachWorkspace";
import { usePatterns } from "@/hooks/usePatterns";
import { DEFAULT_COACH_CONTEXT_SELECTION } from "@/types/coach";
import type { CoachContextSelection, CoachMessage } from "@/types/coach";

import { CoachComposer } from "./CoachComposer";
import { CoachContextPanel } from "./CoachContextPanel";
import { CoachContextStrip } from "./CoachContextStrip";
import { CoachErrorState } from "./CoachErrorState";
import { CoachMessageBubble } from "./CoachMessageBubble";
import { CoachPreviousConversations } from "./CoachPreviousConversations";
import { CoachStarterCards } from "./CoachStarterCards";
import { CoachThinkingState } from "./CoachThinkingState";
import { Modal } from "@/components/ui/Modal";
import {
  COACH_AI_ACTIVE_PILL_TEXT,
  COACH_COMPOSER_FOLLOW_UP_PLACEHOLDER,
  COACH_COMPOSER_PLACEHOLDER,
  COACH_COMPOSER_THINKING_PLACEHOLDER,
  COACH_EMPTY_STATE_PROMPT,
  COACH_EMPTY_STATE_SUBDESCRIPTION,
  COACH_HEADER_SUBTITLE,
  COACH_PRIVACY_CHIP_TEXT,
  COACH_STARTERS_EYEBROW,
  COACH_STARTER_PROMPTS,
  type CoachStarterCard,
} from "./coach.constants";

const COACH_CONTEXT_STORAGE_PREFIX = "shesync-coach-context:";

/**
 * The user's Manage Context choices are a same-device UI preference, not
 * account data — persisted client-side only, keyed per user so a shared
 * browser can't leak one account's choice into another's session. Falls
 * back to the documented defaults on read failure (private browsing,
 * storage disabled, corrupt value) rather than ever throwing.
 */
function readStoredContextSelection(userId: string): CoachContextSelection | null {
  try {
    const raw = window.localStorage.getItem(`${COACH_CONTEXT_STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CoachContextSelection>;
    if (
      typeof parsed.dailyCheckIns !== "boolean" ||
      typeof parsed.cycleContext !== "boolean" ||
      typeof parsed.periodHistory !== "boolean" ||
      typeof parsed.recentObservations !== "boolean"
    ) {
      return null;
    }
    return parsed as CoachContextSelection;
  } catch {
    return null;
  }
}

function writeStoredContextSelection(userId: string, selection: CoachContextSelection): void {
  try {
    window.localStorage.setItem(`${COACH_CONTEXT_STORAGE_PREFIX}${userId}`, JSON.stringify(selection));
  } catch {
    // Best-effort only — a private window or full storage just won't remember the choice next load.
  }
}

export default function CoachView() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    conversations,
    loadingList,
    activeConversationId,
    messages,
    loadingConversation,
    sending,
    error,
    startNewConversation,
    openConversation,
    removeConversation,
    sendUserMessage,
    retry,
  } = useCoachWorkspace();
  const { observations } = usePatterns();

  const [contextSelection, setContextSelectionState] = useState<CoachContextSelection>(
    () => (user ? readStoredContextSelection(user.id) : null) ?? DEFAULT_COACH_CONTEXT_SELECTION,
  );
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function setContextSelection(selection: CoachContextSelection) {
    setContextSelectionState(selection);
    if (user) writeStoredContextSelection(user.id, selection);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  function handleSend(content: string) {
    void sendUserMessage(content, contextSelection);
  }

  function handleStarterCard(card: CoachStarterCard) {
    const prompt = COACH_STARTER_PROMPTS[card.id];
    if (prompt) handleSend(prompt);
  }

  function handleTurnIntoPartnerContext(message: CoachMessage) {
    const insight = message.fromLogs ?? message.content;
    router.push(`/connect/translate?insight=${encodeURIComponent(insight)}`);
  }

  const isEmpty = messages.length === 0 && !loadingConversation;
  const composerPlaceholder = sending
    ? COACH_COMPOSER_THINKING_PLACEHOLDER
    : isEmpty
      ? COACH_COMPOSER_PLACEHOLDER
      : COACH_COMPOSER_FOLLOW_UP_PLACEHOLDER;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cta-start">Coach</p>
          <h1 className="font-display mt-2 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {isEmpty ? COACH_EMPTY_STATE_PROMPT : "Your conversation"}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{COACH_HEADER_SUBTITLE}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusPill tone="purple" className="uppercase tracking-wide">
            {COACH_AI_ACTIVE_PILL_TEXT}
          </StatusPill>
          <StatusPill tone="sage" className="uppercase tracking-wide">
            {COACH_PRIVACY_CHIP_TEXT}
          </StatusPill>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              aria-label="Previous conversations"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground hover:border-cta-start/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
            >
              <History className="h-4 w-4" aria-hidden="true" />
            </button>
            {!isEmpty && (
              <button
                type="button"
                onClick={startNewConversation}
                aria-label="Start a new conversation"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground hover:border-cta-start/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        {/* Rendered above both branches deliberately: a failed send rolls
            the optimistic user message back out of `messages` (see
            useCoachWorkspace's sendUserMessage), which flips `isEmpty` back
            to true and would otherwise silently strand the error where
            only the non-empty branch showed it — the user would see the
            landing/starter view again with no indication anything went
            wrong. Found live during the 2026-09-08 showcase audit: a
            genuine OpenAI failure produced a correct, honest 502 with a
            real error message server-side, but the UI showed nothing. */}
        {error && <CoachErrorState onRetry={retry} />}

        {isEmpty ? (
          <div className="flex flex-col">
            <div className="order-2 mt-6 sm:order-1 sm:mt-0">
              <p className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {COACH_STARTERS_EYEBROW}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
                {COACH_EMPTY_STATE_SUBDESCRIPTION}
              </p>
              <div className="mt-4">
                <CoachStarterCards onSelect={handleStarterCard} />
              </div>
            </div>

            <div className="order-1 space-y-3 sm:order-2 sm:mt-6">
              <CoachContextStrip
                selection={contextSelection}
                recentObservationsAvailable={observations.length > 0}
                onManageContext={() => setShowContextPanel(true)}
              />
              <CoachComposer onSend={handleSend} disabled={sending} autoFocus placeholder={composerPlaceholder} />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-4" role="log" aria-live="polite">
              {loadingConversation ? (
                <p className="text-sm text-muted-foreground">Loading conversation...</p>
              ) : (
                messages.map((message) => (
                  <CoachMessageBubble
                    key={message.id}
                    message={message}
                    onTurnIntoPartnerContext={handleTurnIntoPartnerContext}
                  />
                ))
              )}
              {sending && <CoachThinkingState />}
              <div ref={messagesEndRef} />
            </div>

            <CoachContextStrip
              selection={contextSelection}
              recentObservationsAvailable={observations.length > 0}
              onManageContext={() => setShowContextPanel(true)}
            />
            <CoachComposer onSend={handleSend} disabled={sending} placeholder={composerPlaceholder} />
          </div>
        )}
      </div>

      {showContextPanel && (
        <CoachContextPanel
          selection={contextSelection}
          recentObservationsAvailable={observations.length > 0}
          onSave={setContextSelection}
          onClose={() => setShowContextPanel(false)}
        />
      )}

      {showHistory && (
        <Modal title="Previous Chats" onClose={() => setShowHistory(false)} maxWidthClassName="max-w-md" placement="right">
          <CoachPreviousConversations
            conversations={conversations}
            activeConversationId={activeConversationId}
            loading={loadingList}
            onOpen={(id) => {
              void openConversation(id);
              setShowHistory(false);
            }}
            onNew={() => {
              startNewConversation();
              setShowHistory(false);
            }}
            onDelete={(id) => void removeConversation(id)}
          />
        </Modal>
      )}
    </div>
  );
}
